const Client = require('../models/Client');

const client1 = new Client({
  client_name: 'Murphy, Parker and Park',
  GSTIN: 378131503,
  state: 'Kansas',
  code: 53,
  address: '0530 Daniel Ramp, Arnoldchester, WI 12232'
});
await client1.save();
const client2 = new Client({
  client_name: 'Mcclain-Torres',
  GSTIN: 378587798,
  state: 'Wyoming',
  code: 91,
  address: '96390 Sparks Underpass Apt. 358, Port Carlhaven, AZ 30986'
});
await client2.save();
const client3 = new Client({
  client_name: 'Rice-Ali',
  GSTIN: 224165993,
  state: 'California',
  code: 57,
  address: '292 Massey Court, Allenside, NM 54376'
});
await client3.save();
const client4 = new Client({
  client_name: 'Crawford Group',
  GSTIN: 670147858,
  state: 'North Carolina',
  code: 77,
  address: '15649 Jones Vista Apt. 763, Navarroport, AL 00694'
});
await client4.save();
const client5 = new Client({
  client_name: 'Gutierrez PLC',
  GSTIN: 401219267,
  state: 'Colorado',
  code: 7,
  address: '37106 Alexandra Common Suite 210, Jerryberg, NC 06167'
});
await client5.save();
const client6 = new Client({
  client_name: 'Kramer, Tucker and Williams',
  GSTIN: 870111885,
  state: 'Kansas',
  code: 53,
  address: 'USS Anderson, FPO AP 01030'
});
await client6.save();
const client7 = new Client({
  client_name: 'Mason, Smith and Swanson',
  GSTIN: 757519983,
  state: 'Nevada',
  code: 60,
  address: '711 Bartlett Cliffs, Michelleville, WV 52071'
});
await client7.save();
const client8 = new Client({
  client_name: 'Garcia Group',
  GSTIN: 802570687,
  state: 'Minnesota',
  code: 5,
  address: '660 Laura Garden Suite 200, Caitlinport, CO 32338'
});
await client8.save();
const client9 = new Client({
  client_name: 'Gonzalez-Smith',
  GSTIN: 437807456,
  state: 'Maine',
  code: 7,
  address: '40348 Ross Lodge, South Laura, MD 41106'
});
await client9.save();
const client10 = new Client({
  client_name: 'Navarro-Parrish',
  GSTIN: 924343709,
  state: 'Nebraska',
  code: 70,
  address: '187 Tamara Loaf, Peterchester, HI 13990'
});
await client10.save();
const client11 = new Client({
  client_name: 'Ross LLC',
  GSTIN: 130690695,
  state: 'South Carolina',
  code: 95,
  address: '86617 Jason Roads, Jacobhaven, MT 90942'
});
await client11.save();
const client12 = new Client({
  client_name: 'Anderson Group',
  GSTIN: 888567311,
  state: 'Wyoming',
  code: 95,
  address: '828 Michelle Road Apt. 015, Curryview, ID 53873'
});
await client12.save();
const client13 = new Client({
  client_name: 'Rowland, Schultz and Harper',
  GSTIN: 370609854,
  state: 'Kansas',
  code: 43,
  address: '646 Michael Ville Suite 051, New Sharon, MI 93823'
});
await client13.save();
const client14 = new Client({
  client_name: 'Moore-Clark',
  GSTIN: 928851529,
  state: 'Delaware',
  code: 31,
  address: '41720 Mcdonald Walks, Port Rebeccaton, CT 34660'
});
await client14.save();
const client15 = new Client({
  client_name: 'Patel Ltd',
  GSTIN: 203977996,
  state: 'South Carolina',
  code: 39,
  address: '545 Mark Pines Apt. 722, West Johnny, NE 43398'
});
await client15.save();
const client16 = new Client({
  client_name: 'Mendoza Inc',
  GSTIN: 467038065,
  state: 'Texas',
  code: 89,
  address: '895 Montes Pike Apt. 129, Danieltown, MT 58821'
});
await client16.save();
const client17 = new Client({
  client_name: 'Luna LLC',
  GSTIN: 833254052,
  state: 'Alaska',
  code: 55,
  address: '260 Glenda Dam Suite 289, Patricktown, ND 90777'
});
await client17.save();
const client18 = new Client({
  client_name: 'Chase LLC',
  GSTIN: 834577179,
  state: 'Nevada',
  code: 54,
  address: '0483 Cassandra Locks, Wolfeville, MO 93036'
});
await client18.save();
const client19 = new Client({
  client_name: 'Hobbs, Jenkins and Price',
  GSTIN: 803927168,
  state: 'Ohio',
  code: 35,
  address: '64144 Gonzales Parkways Apt. 320, South John, SD 47897'
});
await client19.save();
const client20 = new Client({
  client_name: 'Johnson, Mcpherson and Marks',
  GSTIN: 794588845,
  state: 'Kansas',
  code: 64,
  address: '4428 Jessica Divide, New Brianton, TN 85828'
});
await client20.save();
const client21 = new Client({
  client_name: 'Tran, Morgan and Dunn',
  GSTIN: 739189205,
  state: 'Oregon',
  code: 41,
  address: '011 Erik Roads Suite 079, Daltonmouth, IL 93726'
});
await client21.save();
const client22 = new Client({
  client_name: 'Bowen, Pearson and Gonzalez',
  GSTIN: 894838934,
  state: 'Arkansas',
  code: 52,
  address: '97665 Kaitlin Garden, Pearsonborough, AK 23054'
});
await client22.save();
const client23 = new Client({
  client_name: 'Smith-Rogers',
  GSTIN: 981466151,
  state: 'Idaho',
  code: 27,
  address: '497 Deanna Forks, Sanchezmouth, MO 72289'
});
await client23.save();
const client24 = new Client({
  client_name: 'Daniels, Smith and Smith',
  GSTIN: 733421044,
  state: 'Washington',
  code: 98,
  address: '88046 Richard Groves, North Michaelville, NC 37534'
});
await client24.save();
const client25 = new Client({
  client_name: 'Chen-Alexander',
  GSTIN: 560718859,
  state: 'North Carolina',
  code: 94,
  address: '209 Odonnell Via Suite 736, North Brookestad, MS 21129'
});
await client25.save();
const client26 = new Client({
  client_name: 'Hubbard-Moreno',
  GSTIN: 782594483,
  state: 'Connecticut',
  code: 17,
  address: '33889 Jacqueline Stravenue Suite 117, Garrettton, NE 17341'
});
await client26.save();
const client27 = new Client({
  client_name: 'Wolf Ltd',
  GSTIN: 881696259,
  state: 'Arizona',
  code: 11,
  address: '584 Michael Throughway, North Tinaview, PA 29134'
});
await client27.save();
const client28 = new Client({
  client_name: 'Cordova, Turner and Morton',
  GSTIN: 916781676,
  state: 'West Virginia',
  code: 5,
  address: 'USS Michael, FPO AP 00920'
});
await client28.save();
const client29 = new Client({
  client_name: 'Hudson, Wells and Taylor',
  GSTIN: 868545205,
  state: 'New York',
  code: 24,
  address: '08272 Michelle Expressway Apt. 468, Brownstad, CA 24965'
});
await client29.save();
const client30 = new Client({
  client_name: 'Morris Group',
  GSTIN: 155117253,
  state: 'North Carolina',
  code: 4,
  address: 'PSC 2373, Box 5128, APO AA 04611'
});
await client30.save();
const client31 = new Client({
  client_name: 'James, Blankenship and Sanders',
  GSTIN: 890986818,
  state: 'Wyoming',
  code: 74,
  address: '1623 Anderson Island, East Stephaniemouth, TX 24370'
});
await client31.save();
const client32 = new Client({
  client_name: 'Rodgers, Hardin and Jackson',
  GSTIN: 732961754,
  state: 'Washington',
  code: 94,
  address: '57487 Eric Drive, Cainfort, VT 20567'
});
await client32.save();
const client33 = new Client({
  client_name: 'Stout-Allen',
  GSTIN: 420226678,
  state: 'Texas',
  code: 34,
  address: '29222 Hayes Spurs Apt. 551, New Jeremy, SC 21286'
});
await client33.save();
const client34 = new Client({
  client_name: 'Thomas LLC',
  GSTIN: 244250556,
  state: 'Kentucky',
  code: 50,
  address: '007 Hall Rapid, Marshallland, MI 30471'
});
await client34.save();
const client35 = new Client({
  client_name: 'Mcintyre-French',
  GSTIN: 920139934,
  state: 'Nevada',
  code: 24,
  address: '6666 Woods Tunnel Suite 757, South William, IA 46840'
});
await client35.save();
const client36 = new Client({
  client_name: 'Price-Burton',
  GSTIN: 889473476,
  state: 'Wyoming',
  code: 4,
  address: '96042 Brown Points Apt. 554, Lake Deborah, KS 45112'
});
await client36.save();
const client37 = new Client({
  client_name: 'Cole LLC',
  GSTIN: 280185003,
  state: 'Kansas',
  code: 21,
  address: 'PSC 8928, Box 0515, APO AA 52148'
});
await client37.save();
const client38 = new Client({
  client_name: 'Tyler, Cook and Ruiz',
  GSTIN: 919540662,
  state: 'South Dakota',
  code: 26,
  address: '45009 Colon Expressway, South Wendyland, AK 80280'
});
await client38.save();
const client39 = new Client({
  client_name: 'Jackson Group',
  GSTIN: 321200300,
  state: 'Wyoming',
  code: 11,
  address: '937 Mark Parks, Sarahmouth, NH 93896'
});
await client39.save();
const client40 = new Client({
  client_name: 'Smith-Wright',
  GSTIN: 596012399,
  state: 'New Mexico',
  code: 44,
  address: '44017 Brandon Canyon Apt. 715, Cindytown, OH 04317'
});
await client40.save();
const client41 = new Client({
  client_name: 'Lin, Hickman and Higgins',
  GSTIN: 736656285,
  state: 'Rhode Island',
  code: 15,
  address: '163 Edward Circles, Lake Elaineport, AL 60231'
});
await client41.save();
const client42 = new Client({
  client_name: 'Massey-Ward',
  GSTIN: 748159105,
  state: 'Montana',
  code: 58,
  address: '72227 Watson Summit, Walkerstad, MA 19135'
});
await client42.save();
const client43 = new Client({
  client_name: 'Gregory PLC',
  GSTIN: 298708324,
  state: 'Delaware',
  code: 49,
  address: '11824 Mitchell Turnpike, Scottshire, MI 15398'
});
await client43.save();
const client44 = new Client({
  client_name: 'Ali-Turner',
  GSTIN: 919547582,
  state: 'Oregon',
  code: 90,
  address: '99484 Thompson Point, South Kenneth, SD 98128'
});
await client44.save();
const client45 = new Client({
  client_name: 'Cunningham-Garcia',
  GSTIN: 216720434,
  state: 'New Mexico',
  code: 23,
  address: '33902 Robert Grove, Lake Traci, ND 58742'
});
await client45.save();
const client46 = new Client({
  client_name: 'Lee-Brown',
  GSTIN: 852957800,
  state: 'California',
  code: 12,
  address: '186 Sarah Divide Suite 512, Chandlerport, MS 38179'
});
await client46.save();
const client47 = new Client({
  client_name: 'Jones, Mcguire and Douglas',
  GSTIN: 471876210,
  state: 'New Mexico',
  code: 34,
  address: '21880 Jonathan Island, Port Dennisburgh, MD 04354'
});
await client47.save();
const client48 = new Client({
  client_name: 'Roberts Group',
  GSTIN: 859697966,
  state: 'Wyoming',
  code: 61,
  address: '458 Alejandro Pines Suite 506, Lake Grant, WI 83060'
});
await client48.save();
const client49 = new Client({
  client_name: 'Miles Ltd',
  GSTIN: 145953462,
  state: 'Hawaii',
  code: 40,
  address: '8238 Suarez Ports, Millerberg, CT 91241'
});
await client49.save();
const client50 = new Client({
  client_name: 'Huff Ltd',
  GSTIN: 761438808,
  state: 'North Dakota',
  code: 92,
  address: '6808 Roger Stravenue Apt. 492, Allenbury, MA 99828'
});
await client50.save();
const client51 = new Client({
  client_name: 'White Ltd',
  GSTIN: 858170885,
  state: 'New York',
  code: 98,
  address: 'USNV Hinton, FPO AP 79081'
});
await client51.save();
const client52 = new Client({
  client_name: 'Nguyen PLC',
  GSTIN: 716340648,
  state: 'Indiana',
  code: 25,
  address: '5722 Douglas Field, Jefferychester, GA 10399'
});
await client52.save();
const client53 = new Client({
  client_name: 'Stewart, White and Ramirez',
  GSTIN: 702575414,
  state: 'Idaho',
  code: 30,
  address: '022 Hutchinson Mission Apt. 287, Lake Tara, UT 97877'
});
await client53.save();
const client54 = new Client({
  client_name: 'Bishop-Williams',
  GSTIN: 181308577,
  state: 'Louisiana',
  code: 85,
  address: '93032 Monica Bypass, Timothyview, AL 79044'
});
await client54.save();
const client55 = new Client({
  client_name: 'Lopez PLC',
  GSTIN: 796014387,
  state: 'New Jersey',
  code: 95,
  address: 'Unit 2002 Box 3562, DPO AE 86725'
});
await client55.save();
const client56 = new Client({
  client_name: 'Schaefer Group',
  GSTIN: 839327655,
  state: 'Tennessee',
  code: 15,
  address: '25566 Evans Inlet Suite 172, East Jesse, OK 43122'
});
await client56.save();
const client57 = new Client({
  client_name: 'Shields-Edwards',
  GSTIN: 403366410,
  state: 'Connecticut',
  code: 48,
  address: '0486 Candice Groves Suite 400, North Joseph, WY 02755'
});
await client57.save();
const client58 = new Client({
  client_name: 'Gonzalez-Morales',
  GSTIN: 916359157,
  state: 'Mississippi',
  code: 34,
  address: '0351 Tanya Rue Apt. 586, Brownbury, RI 12245'
});
await client58.save();
const client59 = new Client({
  client_name: 'Reed and Sons',
  GSTIN: 960310586,
  state: 'Michigan',
  code: 46,
  address: 'USS Hampton, FPO AP 43341'
});
await client59.save();
const client60 = new Client({
  client_name: 'Rodgers and Sons',
  GSTIN: 893167583,
  state: 'Idaho',
  code: 40,
  address: '7230 Garza Common, Lake Joshua, AL 94891'
});
await client60.save();
const client61 = new Client({
  client_name: 'Jones LLC',
  GSTIN: 467047066,
  state: 'Arkansas',
  code: 84,
  address: '6498 Loretta Dale Apt. 567, Port Katieton, ME 14339'
});
await client61.save();
const client62 = new Client({
  client_name: 'Walls Inc',
  GSTIN: 244169328,
  state: 'Minnesota',
  code: 3,
  address: '93545 Mary Circles, Natalieside, WY 69106'
});
await client62.save();
const client63 = new Client({
  client_name: 'Rogers, Stanley and Contreras',
  GSTIN: 419778360,
  state: 'Minnesota',
  code: 23,
  address: 'PSC 9625, Box 1920, APO AP 86359'
});
await client63.save();
const client64 = new Client({
  client_name: 'Perez-Morrison',
  GSTIN: 765792378,
  state: 'Indiana',
  code: 82,
  address: '7055 Tina Knolls Apt. 819, East Michael, MS 69900'
});
await client64.save();
const client65 = new Client({
  client_name: 'Petty Group',
  GSTIN: 154742172,
  state: 'West Virginia',
  code: 54,
  address: '160 Jonathan Spurs, West Michaelport, AR 42503'
});
await client65.save();
const client66 = new Client({
  client_name: 'Davis, Cochran and Sanchez',
  GSTIN: 998250739,
  state: 'North Dakota',
  code: 92,
  address: '95254 Charles Turnpike, Samanthaside, KY 20247'
});
await client66.save();
const client67 = new Client({
  client_name: 'Lane and Sons',
  GSTIN: 572100009,
  state: 'South Dakota',
  code: 37,
  address: '74069 Johnson Well, Phillipsmouth, IN 56746'
});
await client67.save();
const client68 = new Client({
  client_name: 'Jones-Castro',
  GSTIN: 623053412,
  state: 'Kentucky',
  code: 90,
  address: 'Unit 0565 Box 7825, DPO AA 65871'
});
await client68.save();
const client69 = new Client({
  client_name: 'Valdez-Mcknight',
  GSTIN: 488526438,
  state: 'Virginia',
  code: 24,
  address: '3653 Mcintosh Pass Apt. 880, Rachelport, SC 55103'
});
await client69.save();
const client70 = new Client({
  client_name: 'Dixon, Howell and Haynes',
  GSTIN: 943434276,
  state: 'New Mexico',
  code: 97,
  address: '8510 Evans Harbors, Josephhaven, MD 93773'
});
await client70.save();
const client71 = new Client({
  client_name: 'Delacruz Group',
  GSTIN: 388179219,
  state: 'Wyoming',
  code: 79,
  address: 'PSC 5063, Box 9765, APO AP 94401'
});
await client71.save();
const client72 = new Client({
  client_name: 'Taylor-Mckinney',
  GSTIN: 207881348,
  state: 'Utah',
  code: 29,
  address: '67841 Lopez Estate, North Sara, NM 87181'
});
await client72.save();
const client73 = new Client({
  client_name: 'Morales, Thomas and Buchanan',
  GSTIN: 617412981,
  state: 'Indiana',
  code: 40,
  address: '1553 Perkins Greens Apt. 273, Dawnton, PA 63898'
});
await client73.save();
const client74 = new Client({
  client_name: 'Clark-Rojas',
  GSTIN: 659752224,
  state: 'South Carolina',
  code: 31,
  address: '06660 Moses Terrace Apt. 711, Lake Elijahberg, OR 33035'
});
await client74.save();
const client75 = new Client({
  client_name: 'Riley Group',
  GSTIN: 743090316,
  state: 'Mississippi',
  code: 22,
  address: '48794 Mills Manors Suite 050, East Lauren, AZ 58891'
});
await client75.save();
const client76 = new Client({
  client_name: 'Torres and Sons',
  GSTIN: 493925734,
  state: 'Georgia',
  code: 52,
  address: 'USNS Johnson, FPO AA 56664'
});
await client76.save();
const client77 = new Client({
  client_name: 'Orr, Horn and Olson',
  GSTIN: 438504761,
  state: 'Michigan',
  code: 92,
  address: '044 Howell Cliffs Suite 224, North Dawnfurt, NH 86808'
});
await client77.save();
const client78 = new Client({
  client_name: 'Payne Group',
  GSTIN: 445710134,
  state: 'Oklahoma',
  code: 70,
  address: 'USNV Harvey, FPO AP 88679'
});
await client78.save();
const client79 = new Client({
  client_name: 'Wolfe-Hernandez',
  GSTIN: 481773536,
  state: 'Indiana',
  code: 70,
  address: '987 Joshua Hill, Hernandezborough, NV 42925'
});
await client79.save();
const client80 = new Client({
  client_name: 'Erickson, Shannon and Crawford',
  GSTIN: 893181348,
  state: 'Virginia',
  code: 41,
  address: '93514 Gay Point, East Mike, IA 75188'
});
await client80.save();
const client81 = new Client({
  client_name: 'Craig, Hoffman and Wilson',
  GSTIN: 353304111,
  state: 'Kansas',
  code: 80,
  address: '240 Melanie Plains Apt. 242, South Gregory, SC 50969'
});
await client81.save();
const client82 = new Client({
  client_name: 'Mitchell-Thomas',
  GSTIN: 425161468,
  state: 'Michigan',
  code: 98,
  address: '4154 Reed Canyon, Johnsonbury, FL 97126'
});
await client82.save();
const client83 = new Client({
  client_name: 'Martin, Carson and Young',
  GSTIN: 514361667,
  state: 'Oklahoma',
  code: 42,
  address: '628 Kevin Center Apt. 310, North Williamfort, HI 43988'
});
await client83.save();
const client84 = new Client({
  client_name: 'Parker PLC',
  GSTIN: 582080934,
  state: 'Georgia',
  code: 34,
  address: '82630 Betty Rue Apt. 303, South Anthony, ID 15120'
});
await client84.save();
const client85 = new Client({
  client_name: 'Escobar-Hernandez',
  GSTIN: 384644823,
  state: 'Maryland',
  code: 67,
  address: '05346 Jacqueline Valley, Lake Kayla, MT 20300'
});
await client85.save();
const client86 = new Client({
  client_name: 'Huerta, Guerra and Edwards',
  GSTIN: 232258979,
  state: 'Alabama',
  code: 51,
  address: '376 Yvonne Cape Suite 244, East Anitaland, UT 25629'
});
await client86.save();
const client87 = new Client({
  client_name: 'Murray PLC',
  GSTIN: 552725504,
  state: 'Rhode Island',
  code: 55,
  address: '000 Warren Fields, North Trevor, MO 22598'
});
await client87.save();
const client88 = new Client({
  client_name: 'Jackson, Hines and Payne',
  GSTIN: 214193090,
  state: 'Vermont',
  code: 60,
  address: '07637 Dillon Prairie Apt. 854, Brandonborough, CT 09279'
});
await client88.save();
const client89 = new Client({
  client_name: 'Robles-Kim',
  GSTIN: 581212063,
  state: 'South Dakota',
  code: 25,
  address: '30341 Pham Rest Suite 819, Port Ashley, MO 55663'
});
await client89.save();
const client90 = new Client({
  client_name: 'May Group',
  GSTIN: 198902714,
  state: 'California',
  code: 69,
  address: '953 Stafford Garden, Lake Denisebury, MI 98482'
});
await client90.save();
const client91 = new Client({
  client_name: 'Castillo Ltd',
  GSTIN: 947347116,
  state: 'Kansas',
  code: 9,
  address: 'USS Gonzalez, FPO AE 59981'
});
await client91.save();
const client92 = new Client({
  client_name: 'Morse Group',
  GSTIN: 692109503,
  state: 'North Carolina',
  code: 84,
  address: '974 Monica Point Apt. 242, North Anthonytown, CO 94391'
});
await client92.save();
const client93 = new Client({
  client_name: 'Saunders, Carr and Nelson',
  GSTIN: 458729989,
  state: 'Idaho',
  code: 65,
  address: '44272 Briggs Village, Port Brookemouth, ME 25141'
});
await client93.save();
const client94 = new Client({
  client_name: 'Garza, Dunn and Sullivan',
  GSTIN: 273711714,
  state: 'Virginia',
  code: 15,
  address: '15420 Ricky Fields, Port Rhondafurt, WA 08155'
});
await client94.save();
const client95 = new Client({
  client_name: 'Cortez, Larsen and Jackson',
  GSTIN: 716782834,
  state: 'Oklahoma',
  code: 18,
  address: '365 Chase Mall, East Mark, CA 85780'
});
await client95.save();
const client96 = new Client({
  client_name: 'Williams-Greene',
  GSTIN: 667428874,
  state: 'Tennessee',
  code: 22,
  address: '117 Walker Union Apt. 995, Ethanton, LA 70926'
});
await client96.save();
const client97 = new Client({
  client_name: 'Moore and Sons',
  GSTIN: 903654927,
  state: 'New Hampshire',
  code: 89,
  address: 'PSC 0202, Box 8179, APO AE 93198'
});
await client97.save();
const client98 = new Client({
  client_name: 'Hunt-Arnold',
  GSTIN: 815247427,
  state: 'Georgia',
  code: 89,
  address: '259 Joshua Flats, South Richard, HI 88721'
});
await client98.save();
const client99 = new Client({
  client_name: 'Kaufman Group',
  GSTIN: 710112843,
  state: 'North Carolina',
  code: 62,
  address: '4293 Derrick Hills Suite 950, New Rogermouth, ND 79349'
});
await client99.save();
const client100 = new Client({
  client_name: 'Bailey, King and Farmer',
  GSTIN: 675959850,
  state: 'California',
  code: 37,
  address: '931 Stanley Shoal Apt. 540, Hansonmouth, MO 78429'
});
await client100.save();
const client101 = new Client({
  client_name: 'Acevedo, Arias and Elliott',
  GSTIN: 813756879,
  state: 'North Dakota',
  code: 40,
  address: '219 Lindsay Cape, New Amy, UT 48898'
});
await client101.save();
const client102 = new Client({
  client_name: 'Costa, Guerra and Keller',
  GSTIN: 906271037,
  state: 'Wisconsin',
  code: 74,
  address: '0966 Heather Trail Apt. 573, Bakertown, NJ 48082'
});
await client102.save();
const client103 = new Client({
  client_name: 'Hansen, Ramos and Delgado',
  GSTIN: 687023115,
  state: 'Nevada',
  code: 39,
  address: '3488 Hughes Crossroad Suite 245, Stephenport, GA 16177'
});
await client103.save();
const client104 = new Client({
  client_name: 'Velazquez Ltd',
  GSTIN: 426791771,
  state: 'Ohio',
  code: 47,
  address: '86730 Adrienne Mountains Suite 834, Kellybury, ND 75728'
});
await client104.save();
const client105 = new Client({
  client_name: 'Sutton-Fields',
  GSTIN: 658403163,
  state: 'Ohio',
  code: 92,
  address: '95681 Riggs Crossing Suite 966, West Suzanne, MD 61688'
});
await client105.save();
const client106 = new Client({
  client_name: 'Shannon PLC',
  GSTIN: 865766542,
  state: 'North Carolina',
  code: 16,
  address: '229 Ryan Field, South Randyfurt, RI 36308'
});
await client106.save();
const client107 = new Client({
  client_name: 'Rodriguez-Guerrero',
  GSTIN: 202498794,
  state: 'Delaware',
  code: 37,
  address: '417 Lynn Fork Suite 191, East Tylerhaven, TX 75427'
});
await client107.save();
const client108 = new Client({
  client_name: 'Young, Hill and Turner',
  GSTIN: 190563157,
  state: 'Rhode Island',
  code: 70,
  address: '046 Cannon Islands Apt. 322, Caseyburgh, OR 90055'
});
await client108.save();
const client109 = new Client({
  client_name: 'Cook-Haas',
  GSTIN: 689553132,
  state: 'California',
  code: 78,
  address: '5186 Jones Villages Suite 211, East Frankport, SD 68561'
});
await client109.save();
const client110 = new Client({
  client_name: 'Miller Inc',
  GSTIN: 922648698,
  state: 'New Jersey',
  code: 66,
  address: '147 William Pass, New Chad, NY 13191'
});
await client110.save();
const client111 = new Client({
  client_name: 'Fuller Ltd',
  GSTIN: 188162176,
  state: 'South Carolina',
  code: 12,
  address: 'Unit 5613 Box 0269, DPO AP 94890'
});
await client111.save();
const client112 = new Client({
  client_name: 'Hernandez-Delacruz',
  GSTIN: 570344982,
  state: 'Georgia',
  code: 4,
  address: '22315 Mcgee Centers Apt. 749, East Mary, NV 33647'
});
await client112.save();
const client113 = new Client({
  client_name: 'Johnson, Dominguez and Stevenson',
  GSTIN: 969990754,
  state: 'Tennessee',
  code: 30,
  address: 'USNV Smith, FPO AP 88189'
});
await client113.save();
const client114 = new Client({
  client_name: 'Dalton, Sanders and Arias',
  GSTIN: 735615468,
  state: 'West Virginia',
  code: 7,
  address: '71223 Alvarado Summit, Parkermouth, NM 00688'
});
await client114.save();
const client115 = new Client({
  client_name: 'Johnson Ltd',
  GSTIN: 333485264,
  state: 'Idaho',
  code: 34,
  address: 'USNS Hendricks, FPO AA 81269'
});
await client115.save();
const client116 = new Client({
  client_name: 'Wiggins-Schmidt',
  GSTIN: 481093872,
  state: 'Maryland',
  code: 52,
  address: '5553 Young Stream, Lake Melissa, NC 94271'
});
await client116.save();
const client117 = new Client({
  client_name: 'Dean and Sons',
  GSTIN: 345501703,
  state: 'Mississippi',
  code: 84,
  address: '973 Murphy Well Apt. 618, Kaneberg, RI 71410'
});
await client117.save();
const client118 = new Client({
  client_name: 'Knox-Bond',
  GSTIN: 762043558,
  state: 'Kentucky',
  code: 39,
  address: '6788 Susan Expressway, West Sarah, GA 61580'
});
await client118.save();
const client119 = new Client({
  client_name: 'Shaffer-Lawrence',
  GSTIN: 614478649,
  state: 'North Dakota',
  code: 34,
  address: '33890 Jacobs Terrace, Crawfordtown, MI 35384'
});
await client119.save();
const client120 = new Client({
  client_name: 'Bass-White',
  GSTIN: 818274485,
  state: 'Rhode Island',
  code: 20,
  address: '57113 Roth Corner Apt. 556, Sarahville, FL 01363'
});
await client120.save();
const client121 = new Client({
  client_name: 'Gallagher Ltd',
  GSTIN: 106406966,
  state: 'Florida',
  code: 58,
  address: '628 Bill Ferry, New Troyhaven, MD 60344'
});
await client121.save();
const client122 = new Client({
  client_name: 'Eaton Inc',
  GSTIN: 669400633,
  state: 'Minnesota',
  code: 44,
  address: '8287 Green Glens, South Madisonview, MT 33529'
});
await client122.save();
const client123 = new Client({
  client_name: 'Reynolds and Sons',
  GSTIN: 786661355,
  state: 'New Mexico',
  code: 27,
  address: '619 Edwards Parkways Suite 323, Lake Joshua, HI 00770'
});
await client123.save();
const client124 = new Client({
  client_name: 'Young-Day',
  GSTIN: 385888593,
  state: 'Arizona',
  code: 60,
  address: '0078 Elizabeth Greens Suite 857, Vincentberg, OH 57977'
});
await client124.save();
const client125 = new Client({
  client_name: 'Todd, Johnson and Beltran',
  GSTIN: 343859626,
  state: 'Delaware',
  code: 27,
  address: '74565 Walker Shore Suite 972, Port Heatherhaven, LA 54269'
});
await client125.save();
const client126 = new Client({
  client_name: 'Hawkins LLC',
  GSTIN: 780014937,
  state: 'Arizona',
  code: 51,
  address: '7775 Larsen Heights, New Patricia, UT 21939'
});
await client126.save();
const client127 = new Client({
  client_name: 'Lucas LLC',
  GSTIN: 121422702,
  state: 'California',
  code: 23,
  address: 'Unit 5283 Box 8255, DPO AE 30173'
});
await client127.save();
const client128 = new Client({
  client_name: 'Mccoy, Weiss and Davis',
  GSTIN: 412670763,
  state: 'Florida',
  code: 23,
  address: '6780 Solomon Junction, Richardberg, LA 91294'
});
await client128.save();
const client129 = new Client({
  client_name: 'Simon, Holmes and Jenkins',
  GSTIN: 412154321,
  state: 'Indiana',
  code: 7,
  address: '927 Mendoza Rue, Port Jason, MT 19610'
});
await client129.save();
const client130 = new Client({
  client_name: 'Ferguson-Moreno',
  GSTIN: 908816571,
  state: 'Oklahoma',
  code: 5,
  address: '541 Dunn Groves, South Jasonside, AK 49328'
});
await client130.save();
const client131 = new Client({
  client_name: 'Johnson-Waters',
  GSTIN: 893117770,
  state: 'Virginia',
  code: 51,
  address: '16944 Garcia Lodge Suite 215, Donaldton, TN 68346'
});
await client131.save();
const client132 = new Client({
  client_name: 'Curtis, Ramirez and Baldwin',
  GSTIN: 813443501,
  state: 'Arizona',
  code: 68,
  address: '906 Camacho Streets Apt. 594, Valeriemouth, IL 88975'
});
await client132.save();
const client133 = new Client({
  client_name: 'Price Group',
  GSTIN: 667564216,
  state: 'Vermont',
  code: 87,
  address: 'USNS Bennett, FPO AE 13442'
});
await client133.save();
const client134 = new Client({
  client_name: 'Robinson, Thompson and Long',
  GSTIN: 219369734,
  state: 'West Virginia',
  code: 18,
  address: '734 Hammond Keys, Port Michaelberg, OR 62330'
});
await client134.save();
const client135 = new Client({
  client_name: 'Fernandez and Sons',
  GSTIN: 678113782,
  state: 'Arizona',
  code: 13,
  address: '6321 Courtney Ranch, Erikastad, VT 46633'
});
await client135.save();
const client136 = new Client({
  client_name: 'Wilkins, Ramirez and Walter',
  GSTIN: 515528105,
  state: 'North Carolina',
  code: 8,
  address: '793 Howard Brook Apt. 551, South Leah, HI 60200'
});
await client136.save();
const client137 = new Client({
  client_name: 'Mason-Alvarez',
  GSTIN: 607911059,
  state: 'New Mexico',
  code: 64,
  address: '6661 Chad Crest, Trujilloside, IL 77742'
});
await client137.save();
const client138 = new Client({
  client_name: 'Johnson-Ryan',
  GSTIN: 608269627,
  state: 'Wyoming',
  code: 7,
  address: '747 Justin Mountain Apt. 649, Anthonymouth, AR 28673'
});
await client138.save();
const client139 = new Client({
  client_name: 'Dorsey, Martinez and Anderson',
  GSTIN: 947401367,
  state: 'Georgia',
  code: 31,
  address: '6516 Justin Radial Suite 468, Rochaside, MD 77972'
});
await client139.save();
const client140 = new Client({
  client_name: 'Patton, Mcdonald and Smith',
  GSTIN: 632070850,
  state: 'Oklahoma',
  code: 98,
  address: '540 Jose Shore Suite 774, Annaberg, NJ 38830'
});
await client140.save();
const client141 = new Client({
  client_name: 'Lam-Walker',
  GSTIN: 522860182,
  state: 'New Jersey',
  code: 95,
  address: '307 Elliott Mission Suite 347, East Valerieborough, NM 11598'
});
await client141.save();
const client142 = new Client({
  client_name: 'Bond PLC',
  GSTIN: 699199407,
  state: 'Kansas',
  code: 16,
  address: 'Unit 7247 Box 4704, DPO AP 71098'
});
await client142.save();
const client143 = new Client({
  client_name: 'Burgess LLC',
  GSTIN: 207153814,
  state: 'California',
  code: 38,
  address: '644 Brown Points, Josephland, PA 26515'
});
await client143.save();
const client144 = new Client({
  client_name: 'Rowe-Smith',
  GSTIN: 306726516,
  state: 'Vermont',
  code: 71,
  address: '3241 Smith Estate Suite 223, South Alexafort, CO 62830'
});
await client144.save();
const client145 = new Client({
  client_name: 'Fields-Washington',
  GSTIN: 878305481,
  state: 'Virginia',
  code: 30,
  address: '04810 Stephanie Knoll Apt. 830, Hansenhaven, DE 77252'
});
await client145.save();
const client146 = new Client({
  client_name: 'Dougherty-Graves',
  GSTIN: 588264940,
  state: 'Montana',
  code: 76,
  address: '025 Villanueva Island Suite 577, Bonnieland, LA 88407'
});
await client146.save();
const client147 = new Client({
  client_name: 'Turner Group',
  GSTIN: 826474603,
  state: 'Nevada',
  code: 19,
  address: 'USS Adams, FPO AE 48669'
});
await client147.save();
const client148 = new Client({
  client_name: 'Mcclain-Hart',
  GSTIN: 776972752,
  state: 'New York',
  code: 8,
  address: '04895 Jason Forks Apt. 288, Port Michael, CA 58734'
});
await client148.save();
const client149 = new Client({
  client_name: 'Thomas, Bailey and Thompson',
  GSTIN: 354837591,
  state: 'South Dakota',
  code: 83,
  address: '231 Harris Trail Suite 876, South Vanessaborough, TN 81344'
});
await client149.save();
const client150 = new Client({
  client_name: 'Murray Inc',
  GSTIN: 596913139,
  state: 'Wyoming',
  code: 18,
  address: '00421 Eric Inlet Suite 129, Davisfort, AR 04712'
});
await client150.save();
const client151 = new Client({
  client_name: 'Holloway-White',
  GSTIN: 872264680,
  state: 'Idaho',
  code: 53,
  address: '641 Anthony Loaf Apt. 335, New Hannahfurt, NE 20373'
});
await client151.save();
const client152 = new Client({
  client_name: 'Morales, Hanson and Knapp',
  GSTIN: 798084172,
  state: 'Georgia',
  code: 35,
  address: '535 Norris Flat Suite 067, Joshuabury, MT 12543'
});
await client152.save();
const client153 = new Client({
  client_name: 'Ellis-Smith',
  GSTIN: 795391878,
  state: 'Alaska',
  code: 46,
  address: '02761 Brent Shore, Hayesbury, OH 13402'
});
await client153.save();
const client154 = new Client({
  client_name: 'Beltran, Vazquez and Miller',
  GSTIN: 381660151,
  state: 'Nebraska',
  code: 56,
  address: '93158 Alexander Inlet, Port Linda, GA 29230'
});
await client154.save();
const client155 = new Client({
  client_name: 'Brown, Anderson and Castillo',
  GSTIN: 559599667,
  state: 'Utah',
  code: 83,
  address: 'Unit 2930 Box 4168, DPO AE 68441'
});
await client155.save();
const client156 = new Client({
  client_name: 'Russell and Sons',
  GSTIN: 948876971,
  state: 'Indiana',
  code: 36,
  address: '4350 David Ford, Lisastad, MO 13478'
});
await client156.save();
const client157 = new Client({
  client_name: 'Long PLC',
  GSTIN: 903095662,
  state: 'South Dakota',
  code: 32,
  address: '69944 Munoz Meadows, Patricialand, VA 59443'
});
await client157.save();
const client158 = new Client({
  client_name: 'Lee, Garcia and Tran',
  GSTIN: 282631011,
  state: 'Virginia',
  code: 76,
  address: '2419 Michael Ridge, Harrellview, ND 69673'
});
await client158.save();
const client159 = new Client({
  client_name: 'Kemp-Walker',
  GSTIN: 381013192,
  state: 'Rhode Island',
  code: 24,
  address: '50776 Lyons Street Suite 405, Adriantown, WI 57776'
});
await client159.save();
const client160 = new Client({
  client_name: 'Lewis, Walker and Miranda',
  GSTIN: 313000638,
  state: 'Utah',
  code: 3,
  address: '627 Kelly Bridge, South Jordan, AL 77574'
});
await client160.save();
const client161 = new Client({
  client_name: 'Hickman-Johnson',
  GSTIN: 555223453,
  state: 'Indiana',
  code: 16,
  address: '72321 Sarah Dam, Lake Allison, CA 28066'
});
await client161.save();
const client162 = new Client({
  client_name: 'Sullivan-Stafford',
  GSTIN: 424228488,
  state: 'Arizona',
  code: 85,
  address: '205 Monica Cliffs Apt. 970, Gomeztown, FL 93242'
});
await client162.save();
const client163 = new Client({
  client_name: 'Jones and Sons',
  GSTIN: 459352105,
  state: 'Georgia',
  code: 98,
  address: '578 Veronica Meadow, New Joshuaborough, IN 43650'
});
await client163.save();
const client164 = new Client({
  client_name: 'Stewart, Dawson and Johns',
  GSTIN: 202041857,
  state: 'Iowa',
  code: 2,
  address: '19826 Erin Hill Apt. 819, Williamsmouth, SD 50565'
});
await client164.save();
const client165 = new Client({
  client_name: 'James-Marks',
  GSTIN: 887139618,
  state: 'Mississippi',
  code: 16,
  address: '4069 Kevin Place Apt. 921, West Ronald, GA 70362'
});
await client165.save();
const client166 = new Client({
  client_name: 'Leonard, Conley and Weaver',
  GSTIN: 865006666,
  state: 'Michigan',
  code: 46,
  address: '70747 Ferguson Row, South Samantha, AZ 44723'
});
await client166.save();
const client167 = new Client({
  client_name: 'Rivera, Brown and Vazquez',
  GSTIN: 768473620,
  state: 'Georgia',
  code: 82,
  address: '8321 Adam Lodge, West Sarahville, NJ 92604'
});
await client167.save();
const client168 = new Client({
  client_name: 'Parrish Group',
  GSTIN: 385407885,
  state: 'Missouri',
  code: 92,
  address: '594 Hood Stravenue Apt. 635, New Martinhaven, SD 97978'
});
await client168.save();
const client169 = new Client({
  client_name: 'Taylor LLC',
  GSTIN: 771726904,
  state: 'Arkansas',
  code: 91,
  address: '30923 Nichole Run, New Joshua, KY 87588'
});
await client169.save();
const client170 = new Client({
  client_name: 'Ramos-Harrison',
  GSTIN: 433899012,
  state: 'Idaho',
  code: 13,
  address: '56627 Buck Terrace Suite 882, Cabreraborough, MI 22645'
});
await client170.save();
const client171 = new Client({
  client_name: 'Schultz, Johnston and Winters',
  GSTIN: 525339074,
  state: 'North Carolina',
  code: 7,
  address: '338 Ramos Rapids Apt. 453, West Edwin, VA 41531'
});
await client171.save();
const client172 = new Client({
  client_name: 'Chambers and Sons',
  GSTIN: 828328964,
  state: 'West Virginia',
  code: 90,
  address: 'USNS Perez, FPO AE 55798'
});
await client172.save();
const client173 = new Client({
  client_name: 'Mitchell, Howard and Thomas',
  GSTIN: 156246333,
  state: 'South Carolina',
  code: 93,
  address: 'USNV Dean, FPO AE 00991'
});
await client173.save();
const client174 = new Client({
  client_name: 'Phillips, Odom and Gonzalez',
  GSTIN: 300915561,
  state: 'Nebraska',
  code: 18,
  address: '785 Shelia Ramp Suite 340, Youngton, KY 13340'
});
await client174.save();
const client175 = new Client({
  client_name: 'Barnes, Phillips and Vasquez',
  GSTIN: 723650946,
  state: 'West Virginia',
  code: 19,
  address: '050 Paul Prairie, West Alicia, VT 28328'
});
await client175.save();
const client176 = new Client({
  client_name: 'Wagner Ltd',
  GSTIN: 509915045,
  state: 'Massachusetts',
  code: 54,
  address: '050 Thomas Mountain, North Melissamouth, NY 82583'
});
await client176.save();
const client177 = new Client({
  client_name: 'Stokes, Gomez and Davis',
  GSTIN: 640994869,
  state: 'Maine',
  code: 94,
  address: '606 Laura Cliffs Suite 288, Alyssahaven, NE 26397'
});
await client177.save();
const client178 = new Client({
  client_name: 'Haynes-Davis',
  GSTIN: 270021990,
  state: 'Wisconsin',
  code: 93,
  address: '24517 Hardy Mills, Pierceburgh, NE 99167'
});
await client178.save();
const client179 = new Client({
  client_name: 'Medina-Cook',
  GSTIN: 925974482,
  state: 'Wisconsin',
  code: 67,
  address: '6539 Avila Glens Apt. 298, East Jamie, MD 84659'
});
await client179.save();
const client180 = new Client({
  client_name: 'Nelson, Mckee and Coleman',
  GSTIN: 478228167,
  state: 'Ohio',
  code: 21,
  address: '269 Edwin Via, West Ryanborough, ME 89696'
});
await client180.save();
const client181 = new Client({
  client_name: 'Russell, Graves and Turner',
  GSTIN: 429849000,
  state: 'Kansas',
  code: 81,
  address: '193 Hannah Summit, Williamborough, IL 78008'
});
await client181.save();
const client182 = new Client({
  client_name: 'Young and Sons',
  GSTIN: 990007128,
  state: 'Maine',
  code: 64,
  address: 'USNS Taylor, FPO AP 31738'
});
await client182.save();
const client183 = new Client({
  client_name: 'Tucker LLC',
  GSTIN: 746502166,
  state: 'Wyoming',
  code: 75,
  address: 'Unit 2799 Box 5842, DPO AA 51639'
});
await client183.save();
const client184 = new Client({
  client_name: 'Baird, Rhodes and Anderson',
  GSTIN: 859184381,
  state: 'Tennessee',
  code: 8,
  address: '5298 Nunez Shoal, North Jason, GA 94533'
});
await client184.save();
const client185 = new Client({
  client_name: 'Rice Group',
  GSTIN: 645229969,
  state: 'Michigan',
  code: 76,
  address: '3080 Ball Brook Apt. 507, Lake William, MO 25242'
});
await client185.save();
const client186 = new Client({
  client_name: 'Taylor, Velasquez and Lawrence',
  GSTIN: 520393093,
  state: 'Kansas',
  code: 82,
  address: '1246 Harris Station Apt. 091, Paulstad, MI 77836'
});
await client186.save();
const client187 = new Client({
  client_name: 'Miller Inc',
  GSTIN: 462294966,
  state: 'Colorado',
  code: 20,
  address: '907 Daniel Freeway, Brownton, MN 82237'
});
await client187.save();
const client188 = new Client({
  client_name: 'Choi-Gutierrez',
  GSTIN: 173212307,
  state: 'Mississippi',
  code: 72,
  address: '6425 James Cliff, Juanberg, AK 77149'
});
await client188.save();
const client189 = new Client({
  client_name: 'Pace, Reese and Deleon',
  GSTIN: 629417759,
  state: 'Nebraska',
  code: 59,
  address: '0990 Danielle Points, Lake Samuel, MT 63463'
});
await client189.save();
const client190 = new Client({
  client_name: 'Woodward, Myers and Figueroa',
  GSTIN: 239415803,
  state: 'Wyoming',
  code: 94,
  address: '033 Peter Stravenue Suite 259, New Diane, VT 99949'
});
await client190.save();
const client191 = new Client({
  client_name: 'Stout Inc',
  GSTIN: 571108405,
  state: 'Mississippi',
  code: 39,
  address: '03807 Sarah Expressway Apt. 872, Sellersside, VT 04153'
});
await client191.save();
const client192 = new Client({
  client_name: 'Hall, Kane and Johnson',
  GSTIN: 629786688,
  state: 'Florida',
  code: 2,
  address: '442 Horton Port Apt. 425, Haleyview, IL 32717'
});
await client192.save();
const client193 = new Client({
  client_name: 'Byrd, Adams and Sandoval',
  GSTIN: 635625472,
  state: 'Missouri',
  code: 14,
  address: '147 Gonzalez Fall, Joshuafort, NJ 62413'
});
await client193.save();
const client194 = new Client({
  client_name: 'Graves, Austin and Ward',
  GSTIN: 306708327,
  state: 'South Dakota',
  code: 15,
  address: '2907 Thompson Parkways Apt. 923, North Tannertown, OH 98415'
});
await client194.save();
const client195 = new Client({
  client_name: 'Young, Stevens and Marsh',
  GSTIN: 651866082,
  state: 'Connecticut',
  code: 19,
  address: '7532 Christopher Brooks Suite 606, Lake Barbara, TX 80698'
});
await client195.save();
const client196 = new Client({
  client_name: 'Woodward, Cooper and Jimenez',
  GSTIN: 142634268,
  state: 'Arizona',
  code: 53,
  address: '132 Carolyn Gateway Suite 592, Port Carolynshire, WV 52317'
});
await client196.save();
const client197 = new Client({
  client_name: 'Blackburn-Rodriguez',
  GSTIN: 718591422,
  state: 'Georgia',
  code: 38,
  address: '8409 Jane Road Suite 361, East Dantown, ID 26148'
});
await client197.save();
const client198 = new Client({
  client_name: 'Brown-Davis',
  GSTIN: 250996948,
  state: 'Washington',
  code: 81,
  address: 'Unit 5257 Box 5523, DPO AA 91488'
});
await client198.save();
const client199 = new Client({
  client_name: 'Myers and Sons',
  GSTIN: 211297463,
  state: 'New York',
  code: 14,
  address: '970 Leblanc Spur, North Joseph, UT 62389'
});
await client199.save();
const client200 = new Client({
  client_name: 'Black Ltd',
  GSTIN: 845296450,
  state: 'Alabama',
  code: 79,
  address: '3662 Gail Glens Apt. 946, Josephborough, WA 25273'
});
await client200.save();
