const Promise = require("bluebird");
const _ = require("underscore");
const sitemapBuilder = require("sitemap");

module.exports = {
  productsCategoryReport,
  productsUrlsReport,
  buildSitemap
};

function productsCategoryReport(stockKey) {
  var products = [];
  var selectList = [
    "ItemCode",
    "Name",
    "ItemName",
    "actual_studio",
    "actual_kids",
    "actual_home",
    "DiscountPrice",
    "Price",
    "Discount"
  ];

  var productsQuery = {
    Active: "Y",
    excludeWeb: { "!": true },
    Service: { "!": "Y" }
    //U_FAMILIA: 'SI'
    /*
		or:[
			{actual_home: {'>':0}},
			{actual_studio: {'>':0}},
			{actual_kids: {'>':0}}
		]*/
  };

  productsQuery[stockKey] = { ">": 0 };
  return Product.find({ select: selectList, where: productsQuery })
    .populate("Categories")
    .then(function(products) {
      products = products.map(function(product) {
        product.CategoriesListLv1 = product.Categories.reduce(function(
          acum,
          category
        ) {
          if (category.CategoryLevel === 1) {
            if (acum != "") {
              acum += ", ";
            }
            acum += category.Name;
          }
          return acum;
        },
        "");

        product.CategoriesListLv2 = product.Categories.reduce(function(
          acum,
          category
        ) {
          if (category.CategoryLevel === 2) {
            if (acum != "") {
              acum += ", ";
            }
            acum += category.Name;
          }
          return acum;
        },
        "");

        product.CategoriesListLv3 = product.Categories.reduce(function(
          acum,
          category
        ) {
          if (category.CategoryLevel === 3) {
            if (acum != "") {
              acum += ", ";
            }
            acum += category.Name;
          }
          return acum;
        },
        "");

        product = {
          Name: product.Name,
          Precio_Lista: product.Price,
          Porcentaje_Descuento: product.Discount,
          Precio_Final: product.DiscountPrice,
          URL: getProductUrl(product, stockKey),
          ImageURL:
            "https://api.actualstudio.com/uploads/products/" +
            product.icon_filename,
          ItemCode: product.ItemCode,
          ItemName: product.ItemName,
          stock: product[stockKey],
          actual_kids: product.actual_kids,
          actual_studio: product.actual_studio,
          actual_home: product.actual_home,
          CategoriasNivel1: product.CategoriesListLv1,
          CategoriasNivel2: product.CategoriesListLv2,
          CategoriasNivel3: product.CategoriesListLv3
        };
        delete product.Categories;
        return product;
      });
      return products;
    });
}

async function productsUrlsReport(stockKey) {
  const selectList = [
    "ItemCode",
    "Name",
    "ItemName",
    "actual_studio",
    "actual_kids",
    "actual_home"
  ];

  var query = {
    Active: "Y",
    excludeWeb: { "!": true },
    Service: { "!": "Y" },
    [stockKey]: { ">": 0 }
  };
  const products = await Product.find({
    select: selectList,
    where: query
  });
  var urls = products.map(function(product) {
    return getProductUrl(product);
  });
  return urls;
}

async function categoriesUrlReport(siteKey) {
  const selectList = ["Handle"];
  const query = {
    [siteKey]: { ">": 0 }
  };
  const categories = await ProductCategory.find({
    select: selectList,
    where: query
  });
  const urls = categories.map(function(category) {
    return "/category/" + category.Handle;
  });
  return urls;
}

async function buildSitemap(siteKey) {
  const productsUrls = await productsUrlsReport(siteKey);
  const categoriesUrls = await categoriesUrlReport(siteKey);
  const fixedUrls = getFixedUrls();
  const urls = fixedUrls.concat(productsUrls, categoriesUrls);
  var sitemap = sitemapBuilder.createSitemap({
    hostname: getSiteUrlByStockKey(siteKey),
    urls: urls
  });
  return sitemap.toXML();
}

function getFixedUrls() {
  return [
    "/contactanos",
    "/nuestras-tiendas",
    "/search",
    "/facturacion",
    "/envio-y-entrega",
    "/politicas-de-entrega",
    "/politicas-de-almacenaje",
    "/politicas-de-garantia",
    "/cambios-devoluciones-y-cancelaciones",
    "/manual-de-cuidados-y-recomendaciones",
    "/manual-de-cuidados-y-recomendaciones/pieles",
    "/manual-de-cuidados-y-recomendaciones/aceros",
    "/manual-de-cuidados-y-recomendaciones/aluminios",
    "/manual-de-cuidados-y-recomendaciones/cristales",
    "/manual-de-cuidados-y-recomendaciones/cromados",
    "/manual-de-cuidados-y-recomendaciones/maderas",
    "/manual-de-cuidados-y-recomendaciones/piezas-plasticas",
    "/manual-de-cuidados-y-recomendaciones/textiles",
    "/manual-de-cuidados-y-recomendaciones/viniles",
    "/manual-de-cuidados-y-recomendaciones/vinilos",
    "/manual-de-cuidados-y-recomendaciones/pintura-electrostatica",
    "/preguntas-frecuentes",
    "/ciudades-de-entrega",
    "/sugerencias-y-quejas",
    "/ofertas",
    "/compra-segura",
    "/formas-de-pago",
    "/quienes-somos",
    "/filosofia",
    "/nuestras-marcas",
    "/nuestras-tiendas",
    "/aviso-de-privacidad",
    "/terminos-y-condiciones",
    "/seguridad"
  ];
}

function capitalizeFirstLetter(string) {
  var text = string.toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getProductUrl(product, stockKey) {
  product.Name = product.Name || capitalizeFirstLetter(product.ItemName);
  var _name = product.Name.replace(new RegExp(" ", "g"), "-");
  _name = _name.replace(new RegExp("/", "g"), "-");
  _name = _name.toLowerCase();
  var slug = encodeURIComponent(_name);
  if (stockKey) {
    var siteUrl = getSiteUrlByStockKey(stockKey);
    var url = siteUrl + "/" + slug + "/" + product.ItemCode;
  } else {
    var url = "/" + slug + "/" + product.ItemCode;
  }
  return url;
}

function getSiteUrlByStockKey(stockKey) {
  var siteUrl = "";
  switch (stockKey) {
    case "actual_home":
      siteUrl = "https://actualhome.com";
      break;
    case "actual_studio":
      siteUrl = "https://actualstudio.com";
      break;
    case "actual_kids":
      siteUrl = "https://actualkids.com";
      break;
  }
  return siteUrl;
}
