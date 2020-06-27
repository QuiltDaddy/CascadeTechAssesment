# Cascade Fintech RESTful API

Patrick Quilty

## Documentation

## Endpoints

### Add a new user
```
/newUser
```

### JSON:
```json
{
  "email": "tester@cascadefintech.com",
  "password": "VegansRule",
  "phone": "3332221111"
}
```

- email
  - string
  - This field is required to create a new user
  - The system must only allow 1 user per unique email address
- password
  - string
  - This field is required to create a new user
  - Must contain at least 8 characters
- phone
  - number
  - This field is required to create a new user
  - When provided, the phone number must follow this pattern ##########



### Login as user
```
/login
```

### JSON:
```json
{
  "email": "tester@cascadefintech.com",
  "password": "VegansRule",
  "type": "LOGIN"
}
```

- email
  - must be valid user's email
- password
  - must be password associated with user's email
- type
  - must be "LOGIN"



  ### View server logs
```
/logs
```

### JSON:
```json
{
  "email": "tester@cascadefintech.com",
  "password": "VegansRule",
  "type": ["FAILED LOGIN", "LOGIN"],
  "filters": {
    "user": "all",
    "createdRange": "20200626160622-20210626160622"
  }
}
```

- email
  - string
  - This field is required
  - must be valid user's email with Log access
- password
  - string
  - This field is required
  - must be password associated with user's email
- type
  - string or array
  - This field is required
  - must be a string 'all' or an array of any of: ["USER ADDED", "LOGIN", "FAILED LOGIN", "LOG REQUEST", "FAILED LOG REQUEST", "SESSION TIMEOUT"].
- filters
  - user
    - string
    - This field is required
    - must be a string 'all' or a valid user email
  - createdRange
    - string
    - This field is required
    - must be a string 'all' or in the format 'YYYYMMDDHHMMSS-YYYYMMDDHHMMSS' with the first time being earlier

## Thank You!
