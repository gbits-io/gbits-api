# REST API

## Commands

### Update cron.yaml

```
gcloud app deploy cron.yaml
```

## Methods

### Get user data

```
GET https://gbits2021.ew.r.appspot.com/users/618da8b4989f54000ab5a639
(https://gbits2021.ew.r.appspot.com/users/${userID})

GET http://localhost:5000/users/618da8b4989f54000ab5a639
```

### Create new user

```
POST https://gbits2021.ew.r.appspot.com/users/create
payload example:
{
      "status": "active",
      "name": "Alexandr Kazakov",
      "email": "alexandr.kazakov1@gmail.com",
      "balance": 5000,
      "currency_code": "GEE"
}
```

### Send Gbits

```
POST https://gbits2021.ew.r.appspot.com/api/transfers/send
POST http://localhost:5000/api/transfers/send

payload example:
{
      "currency": "GEE",
      "sender": "roman.bischoff@gmail.com",
      "recipient": "alexandr.kazakov1@gmail.com",
      "amount": "14.00",
      "message": "Postman test Message HERE!"
}
```

### Send Wallet Email

```
POST https://gbits2021.ew.r.appspot.com/users/send-wallet
POST http://localhost:5000/users/send-wallet

payload example:
{
  "user_id": "618da8b4989f54000ab5a639"
}
```

### Send Buyinfo Email

```
POST https://gbits2021.ew.r.appspot.com/users/send-buyinfo
POST http://localhost:5000/users/send-buyinfo

payload example:
{
  "user_id": "618da8b4989f54000ab5a639"
}

```

### Get Transactions array(Public Obfuscated Transaction History(for Block Explorer Page))

```
GET https://gbits2021.ew.r.appspot.com/api/transactions/list/?page=${pageNumber}&counter=${limitNumber}


Examples:
* GET https://gbits2021.ew.r.appspot.com/api/transactions/list/?page=2&counter=3
* GET http://localhost:5000/api/transactions/list/?page=2&counter=3

Response JSON:
* transactions array
* totalCount

```

### Get Transaction details(Public Obfuscated Transaction History details(for Block Explorer Page))
```
GET https://gbits2021.ew.r.appspot.com/api/transactions/61d5e4966077acb748734cf8
GET http://localhost:5000/api/transactions/61d5e4966077acb748734cf8
```

### Shedule everyday update task, Users quota & Gmail watcher, etc
```
GET https://gbits2021.ew.r.appspot.com/api/shedule/everydayupdate
GET http://localhost:5000/api/shedule/everydayupdate
```
