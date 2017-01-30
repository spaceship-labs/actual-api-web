module.exports = {
  transfers: transfers,
};

function transfers(group) {
  var studio = [
    {
      currency: 'Pesos',
      bank: 'Banamex',
      sucursal: '7004',
      account: '6988750',
      clabe: '002691700469887500',
      swift: 'BNMXMXMM'
    },
    {
      currency: 'Pesos',
      bank: 'Bancomer',
      sucursal: '-',
      account: '194554957',
      clabe: '012691001945549572',
      swift: '-'
    },
    {
      currency: 'Pesos',
      bank: 'Santander',
      sucursal: '7852',
      account: '65504120542',
      clabe: '014691655041205423',
      swift: '-'
    },
    {
      currency: 'Pesos',
      bank: 'Banorte',
      sucursal: '-',
      account: '0201852130',
      clabe: '072691002018521301',
      swift: '-'
    },
    {
      currency: 'Dólares',
      bank: 'Banamex',
      sucursal: '0001',
      account: '3416508',
      clabe: '002691000134165082',
      swift: 'BNMXMXMM',
    }
  ];
  var noStudio = [
    {
      currency: 'Pesos',
      bank: 'Banamex',
      sucursal: '7010',
      account: '7336557',
      clabe: '002691701073365572',
      swift: 'BNMXMXMM',
    },
    {
      currency: 'Pesos',
      bank: 'Bancomer',
      sucursal: '-',
      account: '105822122',
      clabe: '012691001058221224',
      swift: '-',
    },
    {
      currency: 'Pesos',
      bank: 'Santander',
      sucursal: '7195',
      account: '22000506285',
      clabe: '014691220005062859',
      swift: '-',
    },
    {
      currency: 'Pesos',
      bank: 'Banorte',
      sucursal: '-',
      account: '0429431982',
      clabe: '072691004294319827',
      swift: '-',
    },
    {
      currency: 'Dólares',
      bank: 'Banamex',
      sucursal: '7002',
      account: '9089130',
      clabe: '002691700290891309',
      swift: 'BNMXMXMM',
    },
  ];
  return (group === 'studio' && studio) || noStudio;
}
