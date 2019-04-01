const Promise = require('bluebird');
const _ = require('underscore');
const moment = require('moment');
const ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
  getDetailsStock,
  substractProductsStock,
  validateQuotationStockById,
  isFreeSaleProduct,
  syncOrderDetailsProducts,
  //Exposed for testing
  tagValidDetails,
  findValidDelivery
};

function syncOrderDetailsProducts(orderDetails) {
  var itemCodes = orderDetails.map(function(orderDetail) {
    var product = orderDetail.Product;
    return product.ItemCode;
  });
  itemCodes = _.uniq(itemCodes);
  sails.log.info('Updating :', itemCodes);

  return Promise.map(itemCodes, SyncService.syncProductByItemCode);
}

function isFreeSaleProduct(product) {
  if (product) {
    if (product.freeSale && product.freeSaleStock > 0 && product.freeSaleDeliveryDays) {
      return true;
    }
  }
  return false;
}

//details must be populated with products and shipCompanyFrom
function substractProductsStock(details) {
  return Promise.each(details, substractStockByDetail);
}

function substractStockByDetail(detail) {
  return Promise.join(
    substractProductStockByDetail(detail),
    substractDeliveryStockByDetail(detail)
  );
}

function substractProductStockByDetail(detail) {
  var whsCode = detail.shipCompanyFrom.WhsCode;
  var ItemCode = detail.Product.ItemCode;

  if (isFreeSaleProduct(detail.Product)) {
    var newFreeSaleStock = detail.Product.freeSaleStock - detail.quantity;
    return Product.update({ id: detail.Product.id }, { freeSaleStock: newFreeSaleStock });
    //return new Promise.resolve();
  }

  return getStoresWithProduct(ItemCode, whsCode).then(function(stores) {
    var storesCodes = stores.map(function(s) {
      return s.code;
    });
    if (detail.quantity > detail.Product.Available) {
      return new Promise.reject(
        new Error('Stock del producto ' + ItemCode + ' no disponible (ERROR: PS)')
      );
    }
    var newAvailable = detail.Product.Available - detail.quantity;
    var updateValues = { Available: newAvailable };
    for (var i = 0; i < storesCodes.length; i++) {
      var newCodeStock = detail.Product[storesCodes[i]] - detail.quantity;
      updateValues[storesCodes[i]] = newCodeStock;
      if (isNaN(updateValues[storesCodes[i]])) {
        updateValues[storesCodes[i]] = 0;
      }
    }
    return Product.update({ id: detail.Product.id }, updateValues);
  });
}

function substractDeliveryStockByDetail(detail) {
  var whsCode = detail.shipCompanyFrom.WhsCode;
  var ItemCode = detail.Product.ItemCode;

  if (isFreeSaleProduct(detail.Product)) {
    return new Promise.resolve();
  }

  return DatesDelivery.findOne({
    whsCode: detail.shipCompanyFrom.WhsCode,
    ShipDate: detail.productDate,
    ItemCode: ItemCode,
    ImmediateDelivery: detail.immediateDelivery
  }).then(function(dateDelivery) {
    if (detail.quantity > dateDelivery.OpenCreQty) {
      return Promise.reject(
        new Error('Stock del producto ' + ItemCode + ' no disponible (ERROR: DS)')
      );
    }

    var query = {
      whsCode: detail.shipCompanyFrom.WhsCode,
      ItemCode: ItemCode
    };
    return substractQuantityToDeliveryDates(query, detail.quantity);
  });
}

function substractQuantityToDeliveryDates(deliveryQuery, quantity) {
  return DatesDelivery.find(deliveryQuery).then(function(dateDeliveries) {
    return Promise.each(dateDeliveries, function(dateDelivery) {
      var newStock = dateDelivery.OpenCreQty - quantity;
      var query = { _id: ObjectId(dateDelivery.id) };
      var updateParams = { OpenCreQty: newStock };
      return Common.nativeUpdateOne(query, updateParams, DatesDelivery);
    });
  });
}

function getStoresWithProduct(ItemCode, whsCode) {
  return Delivery.find({ FromCode: whsCode, Active: 'Y' })
    .then(function(deliveries) {
      var warehouses = deliveries.map(function(d) {
        return d.ToCode;
      });
      return Company.find({ WhsCode: warehouses }).populate('Stores');
    })
    .then(function(warehouses) {
      var stores = warehouses.reduce(function(arr, w) {
        arr = arr.concat(w.Stores);
        return arr;
      }, []);
      stores = _.uniq(stores, function(s) {
        return s.id;
      });
      return stores;
    });
}

async function validateQuotationStockById(quotationId, req) {
  var quotation;
  var details;
  return QuotationWeb.findOne({ id: quotationId })
    .populate('Details')
    .then(function(quotationFound) {
      quotation = quotationFound;
      var whsId = req.activeStore.Warehouse;
      details = quotation.Details;
      var detailsIds = details.map(function(d) {
        return d.id;
      });
      return [
        Company.findOne({ id: whsId }),
        QuotationDetailWeb.find({ id: detailsIds }).populate('Product')
      ];
    })
    .spread(function(warehouse, details) {
      var activeStore = req.activeStore;
      return getDetailsStock(details, warehouse, quotation.ZipcodeDelivery, activeStore);
    })
    .then(function(detailsStock) {
      return isValidStock(detailsStock);
    });
}

async function isValidStock(detailsStock) {
  for (var i = 0; i < detailsStock.length; i++) {
    if (!detailsStock[i].validStock) {
      return false;
    }
  }
  return true;
}

//details must be populated with products
async function getDetailsStock(details, warehouse, zipcodeDeliveryId, activeStore) {
  var promises = [];
  var products = details.map(function(detail) {
    return detail.Product;
  });
  products = _.uniq(products, function(product) {
    return product.ItemCode;
  });

  for (var i = 0; i < products.length; i++) {
    var options = {
      zipcodeDeliveryId: zipcodeDeliveryId,
      activeStore: activeStore
    };
    promises.push(Shipping.product(products[i], warehouse, options));
  }

  return Promise.all(promises).then(function(results) {
    var groupedDeliveryDates = results.reduce(function(arr, group) {
      arr = arr.concat(group);
      return arr;
    }, []);

    var finalDetails = tagValidDetails(details, groupedDeliveryDates, activeStore);
    return finalDetails;
  });
}

function tagValidDetails(details, groupedDeliveryDates, activeStore) {
  var validatedDetails = [];

  for (var i = 0; i < details.length; i++) {
    var detailDelivery = findValidDelivery(details[i], groupedDeliveryDates, validatedDetails);

    if (
      detailDelivery &&
      (details[i].Product.Active === 'Y' || details[i].isFreeSale) &&
      (details[i].Product.Service !== 'Y' || details[i].Product.ItemCode === 'SR00078') &&
      details[i].Product.U_FAMILIA === 'SI' &&
      !details[i].Product.excludeWeb &&
      details[i].Product[activeStore.code] > 0
    ) {
      details[i].validStock = true;
    } else {
      details[i].validStock = false;
    }

    validatedDetails.push(details[i]);
  }

  return details;
}

function checkIfProductHasSocietyCodes(product, societyCodes) {
  var productSociety = product.U_Empresa;
  return societyCodes.indexOf(productSociety) > -1;
}

function findValidDelivery(detail, groupedDeliveryDates, validatedDetails) {
  if (!detail.originalShipDate) {
    return false;
  }

  const detailDelivery = _.find(groupedDeliveryDates, function(delivery) {
    if (!delivery.date) {
      return false;
    }

    const DATE_FORMAT = 'DD-MM-YYYY';
    const detailShipDate = moment(detail.originalShipDate)
      .startOf('day')
      .format(DATE_FORMAT);
    const deliveryDate = moment(delivery.date)
      .startOf('day')
      .format(DATE_FORMAT);

    const validatedProductStock = validatedDetails.reduce(function(stock, validatedDetail) {
      if (
        validatedDetail.shipCompanyFrom === delivery.companyFrom &&
        validatedDetail.Product.ItemCode === delivery.itemCode
      ) {
        return (stock += validatedDetail.quantity);
      } else {
        return stock;
      }
    }, 0);

    const deliveryAvailable = delivery.available - validatedProductStock;

    return (
      detail.Product.ItemCode === delivery.itemCode &&
      detailShipDate === deliveryDate &&
      detail.quantity <= deliveryAvailable &&
      (detail.immediateDelivery === delivery.ImmediateDelivery ||
        detail.Product.ItemCode === 'SR00078') &&
      detail.shipCompanyFrom === delivery.companyFrom &&
      detail.shipCompany === delivery.company
    );
  });

  return detailDelivery;
}
