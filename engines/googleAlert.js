
/*
	How often: As-is happens
	Sources: News
	Language: Vietnamese
	Region: Any region
	How many: All Result
	Delever to: RSS Feed
*/
const url_1 = 'https://www.google.com/alerts/preview?params=[null,[null,null,null,[null,"dota 2","com",[null,"vi","US"],null,null,null,0,1],null,2,[[null,1,"cky.chaos.estate@gmail.com",[],1,"en-US",null,null,null,null,null,"0",null,null,"AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8"]],null,null,[1,3]],0]'

// remove key?
const url_2 = 'https://www.google.com/alerts/preview?params=[null,[null,null,null,[null,"thoi%20su%20vnexpress","com",[null,"vi","US"],null,null,null,0,1],null,2,[[null,1,"cky.chaos.estate@gmail.com",[],1,"en-US",null,null,null,null,null,"0",null,null,""]],null,null,[1,3]],0]';

/*
	How often: As-is happens
	Sources: Automatic
	Language: Vietnamese
	Region: Any region
	How many: All Result
	Delever to: RSS Feed
*/
const url_3 = 'https://www.google.com/alerts/preview?params=[null,[null,null,null,[null,"thoi su vnexpress","com",[null,"vi","US"],null,null,null,0,1],null,2,[[null,1,"cky.chaos.estate@gmail.com",[],1,"en-US",null,null,null,null,null,"0",null,null,"AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8"]]],0]';

/*
[
  null,
  [
    null,
    null,
    null,
    [
      null,
      "dota 2",
      "com",
      [
        null,
        "vi",
        "US"
      ],
      null,
      null,
      null,
      0,
      1
    ],
    null,
    3,
    [
      [
        null,
        1,
        "cky.chaos.estate@gmail.com",
        [
          null,
          null,
          15
        ],
        2,
        "en-US",
        null,
        null,
        null,
        null,
        null,
        "0",
        null,
        null,
        "AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8"
      ]
    ]
  ],
  0
]
*/
// https://www.google.com/alerts/preview?params=[null,[null,null,null,[null,"dota 2","com",[null,"vi","US"],null,null,null,0,1],null,3,[[null,1,"cky.chaos.estate@gmail.com",[null,null,15],2,"en-US",null,null,null,null,null,"0",null,null,"AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8"]]],0]


const complete_url = 'https://www.google.com/alerts/preview?params=[null,[null,null,null,[null,"dota 2","com",[null,"vi","US"],null,null,null,0,1],null,2,[[null,1,"cky.chaos.estate@gmail.com",[],1,"en-US",null,null,null,null,null,"0",null,null,"AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8"]]],0]';

/* complete query string
[null,[null,null,null,[null,"dota 2","com",[null,"vi","US"],null,null,null,0,1],null,2,[[null,1,"cky.chaos.estate@gmail.com",[],1,"en-US",null,null,null,null,null,"0",null,null,"AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8"]]],0]
*/

// curl create alert
// curl 'https://www.google.com/alerts/create?x=AMJHsmUrKev4Xd0NZuvVq-Gf7L9SRcSW3A%3A1571919419786' -H 'sec-fetch-mode: cors' -H 'origin: https://www.google.com' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'cookie: googlealertsv=E7TZvfbP7x8UcLNRWq61TXILYwDl3xY; SEARCH_SAMESITE=CgQI2o0B; HSID=AvPgBDHEoi3ALpGmg; SSID=AMwSDJxfCwObZosM0; APISID=l1_0jg3FHPn009Y0/A1VZpduvlNf1TD2Wb; SAPISID=VBNThl_8EDaLOafr/Ah0q-hIqkQXiIjal2; CONSENT=YES+VN.en+201908; SID=oQesH8spcxb84aE7w5s2QCCt01PaETTuLg9UJGOUDJGrAq_kI-sjGriv3Ez3EWbxKEExUQ.; S=billing-ui-v3=4KD8F9L8yyib6RY8aLQNRXlSL50OyzvT:billing-ui-v3-efe=4KD8F9L8yyib6RY8aLQNRXlSL50OyzvT; ANID=AHWqTUnN0EqZAfYyhxYa4px7uRGe9-Gxj3FH2VNurnFhg3raIPAlbeKbcPzX-xDL; NID=190=q14pMZsEWdY1e0NxfeoBS470vgZaPYxYtWXQBS7shCLANmBIO3shAQFlcMODXYL_noBPF2sIWos7uUEelyM9zZYagiJBxIpdByOc2QQCYxkshVQZJ-OSNJkcxeRYScq1uplGxQR2dM_ajvEAzt8Plut3aJB3qB2iy8MJA9Z_BKNdagFeRLgjaVv4dAOlBX0dXe_dZ3o6CtjHMySKOkCLEQ; 1P_JAR=2019-10-24-15; SIDCC=AN0-TYv15NILakxjt5BSZuV-24wi_gaSrIRc8rwntiZrO9oXjIU1Ls362XXhNFwIXJ7qMmW7JS4' -H 'x-client-data: CIW2yQEIpLbJAQjEtskBCKmdygEI3p/KAQjiqMoBCLeqygEIgKvKAQjLrsoBCMqvygEIzrDKAQj2tMoB' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36' -H 'content-type: application/x-www-form-urlencoded;charset=UTF-8' -H 'accept: */*' -H 'referer: https://www.google.com/alerts' -H 'authority: www.google.com' -H 'sec-fetch-site: same-origin' --data 'params=%5Bnull%2C%5Bnull%2Cnull%2Cnull%2C%5Bnull%2C%22dota%202%22%2C%22com%22%2C%5Bnull%2C%22vi%22%2C%22US%22%5D%2Cnull%2Cnull%2Cnull%2C0%2C1%5D%2Cnull%2C2%2C%5B%5Bnull%2C2%2C%22%22%2C%5B%5D%2C1%2C%22en-US%22%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%220%22%2Cnull%2Cnull%2C%22AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8%22%5D%5D%2Cnull%2Cnull%2C%5B1%2C3%5D%5D%5D' --compressed




