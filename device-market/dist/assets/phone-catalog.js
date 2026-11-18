'use strict';
const verifiedPhoneSpecs = {
 "apple_iphone_11-9848": {
  "display": "Liquid Retina IPS LCD",
  "camera": [
   12,
   12
  ]
 },
 "apple_iphone_12-10509": {
  "display": "Super Retina XDR OLED",
  "camera": [
   12,
   12
  ]
 },
 "apple_iphone_13_mini-11104": {
  "display": "Super Retina XDR OLED",
  "camera": [
   12,
   12
  ]
 },
 "apple_iphone_13-11103": {
  "display": "Super Retina XDR OLED",
  "camera": [
   12,
   12
  ]
 },
 "apple_iphone_13_pro-11102": {
  "display": "Super Retina XDR OLED 120 Hz",
  "camera": [
   12,
   12,
   12
  ]
 },
 "apple_iphone_13_pro_max-11089": {
  "display": "Super Retina XDR OLED 120 Hz",
  "camera": [
   12,
   12,
   12
  ]
 },
 "apple_iphone_14-11861": {
  "display": "Super Retina XDR OLED",
  "camera": [
   12,
   12
  ]
 },
 "apple_iphone_15-12559": {
  "display": "Super Retina XDR OLED",
  "camera": [
   48,
   12
  ]
 },
 "apple_iphone_16-13317": {
  "display": "Super Retina XDR OLED",
  "camera": [
   48,
   12
  ]
 },
 "apple_iphone_17-14050": {
  "display": "LTPO Super Retina XDR OLED 120 Hz",
  "camera": [
   48,
   48
  ]
 },
 "samsung_galaxy_s23-12082": {
  "display": "Dynamic AMOLED 2X 120 Hz",
  "camera": [
   50,
   10,
   12
  ]
 },
 "samsung_galaxy_a54-12070": {
  "display": "Super AMOLED 120 Hz",
  "camera": [
   50,
   12,
   5
  ]
 },
 "honor_x9d_5g-14176": {
  "display": "AMOLED 120 Hz",
  "camera": [
   108,
   5
  ]
 }
};
const phoneCatalog = [
 ['Apple','iPhone 11',2019,'6.1″','A13 Bionic','64 / 128 / 256 GB',3110,'4G','A2221','apple_iphone_11-9848'],
 ['Apple','iPhone 12',2020,'6.1″','A14 Bionic','64 / 128 / 256 GB',2815,'5G','A2403','apple_iphone_12-10509'],
 ['Apple','iPhone 13 mini',2021,'5.4″','A15 Bionic','128 / 256 / 512 GB',2438,'5G','A2628','apple_iphone_13_mini-11104'],
 ['Apple','iPhone 13',2021,'6.1″','A15 Bionic','128 / 256 / 512 GB',3240,'5G','A2633','apple_iphone_13-11103'],
 ['Apple','iPhone 13 Pro',2021,'6.1″','A15 Bionic','128 / 256 / 512 GB / 1 TB',3095,'5G','A2638','apple_iphone_13_pro-11102'],
 ['Apple','iPhone 13 Pro Max',2021,'6.7″','A15 Bionic','128 / 256 / 512 GB / 1 TB',4352,'5G','A2643','apple_iphone_13_pro_max-11089'],
 ['Apple','iPhone 14',2022,'6.1″','A15 Bionic','128 / 256 / 512 GB',3279,'5G','A2882','apple_iphone_14-11861'],
 ['Apple','iPhone 15',2023,'6.1″','A16 Bionic','128 / 256 / 512 GB',3349,'5G','A3090','apple_iphone_15-12559'],
 ['Apple','iPhone 16',2024,'6.1″','A18','128 / 256 / 512 GB',3561,'5G','A3287','apple_iphone_16-13317'],
 ['Apple','iPhone 17',2025,'6.3″','A19','256 / 512 GB',3692,'5G','','apple_iphone_17-14050'],
 ['Samsung','Galaxy S23',2023,'6.1″','Snapdragon 8 Gen 2','128 / 256 / 512 GB',3900,'5G','SM-S911B','samsung_galaxy_s23-12082'],
 ['Samsung','Galaxy A54',2023,'6.4″','Exynos 1380','128 / 256 GB',5000,'5G','SM-A546B','samsung_galaxy_a54-12070'],
 ['HONOR','X9d',2025,'6.79″','Snapdragon 6 Gen 4','256 / 512 GB',8300,'5G','MTN-NX1','honor_x9d_5g-14176']
].map(([brand,model,year,screen,chip,storage,battery,network,modelCode,slug]) => ({
 brand,model,year,screen,chip,storage,battery,network,modelCode,...verifiedPhoneSpecs[slug],
 source:'https://www.gsmarena.com/'+slug+'.php',
 gallery:'https://www.gsmarena.com/'+slug.replace(/-(\d+)$/, '-pictures-$1')+'.php',
 image:brand==='HONOR'?'https://fdn2.gsmarena.com/vv/pics/honor/honor-x9d-5g-3.jpg':
  'https://fdn2.gsmarena.com/vv/bigpic/'+slug.replace(/-\d+$/,'').replaceAll('_','-')+(model==='Galaxy S23'?'-5g':'')+'.jpg'
}));

const mobileMartFx = {
 rate:3.1884, date:'2026-11-18', session:'12:00 MYT',
 source:'https://www.bnm.gov.my/latest-rates'
};
const mobileMartBuyback = [
 ['iPhone 12',150],['iPhone 13 Pro',500],['iPhone 13 Pro Max',550],
 ['iPhone 14',420],['iPhone 15',550],['iPhone 16',1070],['iPhone 17',1380],
 ['Galaxy S23',250,'https://mobilemart.io/phone/galaxy-s23']
].map(([model,sgd,source='https://mobilemart.io/highest-buyback/apple'])=>({model,sgd,source}));
