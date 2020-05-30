# API Documentation

The API runs on port `20001`. Please check the CORS settings in `api.js`:
```javascript
app.use(cors({
	credentials: true,
	origin: 'http://localhost'
}));
```

## Common Responses

| Response                                    | Definition                                                   |
| ------------------------------------------- | ------------------------------------------------------------ |
| `{"success": true}`                         | The request was successfully completed                       |
| `{"success": false, "error": "ERROR_CODE"}` | The request was unsuccessful due to the error stated in `error` |

| Error Code        | Definition                                                   |
| ----------------- | ------------------------------------------------------------ |
| `unknown`         | The reason for the failure is not documented                 |
| `session_expired` | The user was logged out due to a permissions change (**this has not been tested**) |
| `auth`            | The endpoint is authenticated but the user has not logged in |

## Accounts

### `/account/create`

Creates a new account

#### Input

```json
{
	"username": "NEW_USERNAME",
	"password": "NEW_PASSWORD",
	"email": "NEW EMAIL"
}
```

#### Output

```json
{
	"success": true
}
```

#### Remarks

* There are no password or email validation services running on the server **[BUG]**

#### Errors

```
No special error codes
```

### `/account/taken/username`

Checks if a username has been taken

#### Input

```json
{
	"username": "USERNAME_TO_CHECK"
}
```

#### Output

```json
{
	"success": true,
	"taken": "bool"
}
```

#### Remarks

* Do not ping this endpoint on every keystroke (check after user stops typing for a certain delay)

#### Errors

```
No special error codes
```

### `/account/taken/email`

Checks if an email address has been taken

#### Input

```json
{
	"email": "EMAIL_ADDRESS_TO_CHECK"
}
```

#### Output

```json
{
	"success": true,
	"taken": "bool"
}
```

#### Remarks

* Do not ping this endpoint on every keystroke (check after user stops typing for a certain delay)

#### Errors

```
No special error codes
```

### `/account/login`

Login endpoint

#### Input

```json
{
	"username": "USERNAME",
	"password": "PASSWORD"
}
```

#### Output

```json
{
	"success": true,
	"permissions": "int from 0-2"
}
```

#### Remarks

* Sets a session cookie

#### Errors

| Error Code | Definition                           |
| ---------- | ------------------------------------ |
| `username` | The username submitted was not found |
| `password` | The password submitted was wrong     |

### `/account/logout`

Creates a new account  
Authenticated

#### Input

```
No input required
```

#### Output

```json
{
	"success": true
}
```

#### Errors

```
No special error codes
```

### `/account/type`

Returns the permissions level of the logged-in user  
Authenticated

#### Input

```
No input required
```

#### Output

```json
{
	"success": true,
	"type": "user/elevated/admin]"
}
```

#### Errors

```
No special error codes
```

### `/account/score/:username`

**HAS NOT BEEN IMPLEMENTED AND IS SUBJECT TO CHANGE**

Returns the score of a requested user.  
Authenticated

#### Input

```
GET: /account/score/USERNAME_OF_USER_TO_CHECK
```

#### Output

```json
{
	"success": true,
	"score": "int"
}
```

#### Errors

```
No special error codes
```

### `/account/password`

Change the password of the user  
Authenticated

#### Input

```json
{
	"password": "OLD_PASSWORD",
	"new_password": "NEW_PASSWORD"
}
```

#### Output

```json
{
	"success": true
}
```

#### Errors

| Error Code       | Definition                                           |
| ---------------- | ---------------------------------------------------- |
| `notfound`       | The username specified was not found                 |
| `empty_password` | The `new_password` field is empty                    |
| `password`       | The `password` field does not match the old password |

### `/account/list`

List all accounts  
Authenticated // Permissions: 2

#### Input

```json
{
	"password": "OLD_PASSWORD",
	"new_password": "NEW_PASSWORD"
}
```

#### Output

```json
{
	"success": true,
	"list": [
		{
			"username": "USERNAME_OF_USER",
			"email": "USER_EMAIL_ADDRESS",
			"type": "int from 0-2 (permissions level)",
			"score": "int"
		},
		{
			"username": "USERNAME_OF_USER",
			"email": "USER_EMAIL_ADDRESS",
			"type": "int from 0-2 (permissions level)",
			"score": "int"
		}
	]
}
```

#### Errors

| Error Code    | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to list all users |

### `/account/permissions`

Changes the permissions of an account  
Authenticated // Permissions: 2

#### Input

```json
{
	"username": "USERNAME_OF_ACCOUNT_TO_CHANGE",
	"type": "int from 0-2 (new permissions level)"
}
```

#### Output

```json
{
	"success": true
}
```

#### Errors

| Error Code    | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to change another user's permission |
| `outofrange`  | `type` is not between 0 to 2                                 |

### `/account/delete`

**HAS NOT BEEN IMPLEMENTED AND IS SUBJECT TO CHANGE**

Deletes an account  
Authenticated // Permissions: 2 for some features

#### Input

```json
{
	"username": "USERNAME OF USER TO BE DELETED (optional)",
	"password": "PASSWORD OF LOGGED IN USER"
}
```

#### Output

```json
{
	"success": true
}
```

#### Remarks

* If `username` is empty, the current user will be deleted
* `username` can only be defined by a user with permissions level 2

#### Errors

| Error Code    | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to delete another user |
| `password`    | The password supplied is wrong                               |

## Challenges

The `CHALLENGE_ID` is a MongoDB Object ID string like `5ed22cfe3a46bd32fc4cf15c`

### `/challenge/list`

**REQUIRES UPDATES**

Show all available challenges  
Authenticated

#### Input

```
No input required
```

#### Output

```json
{
	"success": true,
	"challenges": [
		{
			"id": "CHALLENGE_ID",
			"name": "CHALLENGE_NAME",
			"category": "CHALLENGE_CATEGORY",
			"points": "int",
			"solved": "bool"
		},
		{
			"id": "CHALLENGE_ID",
			"name": "CHALLENGE_NAME",
			"category": "CHALLENGE_CATEGORY",
			"points": "int",
			"solved": "bool"
		}
	]
}
```

#### Remarks

* Only shows challenges with `visibility: true`
* Currently, there is no API endpoint to get challenges with `visibility: false`

#### Errors

```
No special error codes
```

### `/challenge/show/:chall`

Get the details of a challenge  
Authenticated

#### Input

```
GET: /account/score/CHALLENGE_ID
```

#### Output

```json
{
	"success": true,
	"challenge": {
		"name": "CHALLENGE_NAME",
		"category": "CHALLENGE_CATEGORY",
		"description": "CHALLENGE_DESCRIPTION (HTML)",
		"points": "int",
		"author": "CHALLENGE_AUTHOR",
		"created": "CREATION_TIMESTAMP",
		"solves": [
			"USERNAME_OF_SOLVER"
		],
		"max_attempts": "int (0 means unlimited)",
		"tags": [
			"CHALLENGE_TAG"
		],
		"hints": [
			{
				"hint": "HINT_CONTENTS"
			},
			{
				"cost": "int"
			}
		]
	}
}
```

#### Remarks

* Only shows challenges with `visibility: true`
* Currently, there is no API endpoint to get challenges with `visibility: false`
* There is also no way to get all the info (e.g. flags) for the admin panel
* Missing information: number of attempts used up
* Hints: if the hint has been bought, the object will print the hint directly. If not, the `cost` key will be an integer of the number of points needed

#### Errors

```
No special error codes
```

### `/challenge/hint`

Buy a hint for a challenge  
Authenticated

#### Input

```
{
	"id": "int",
	"chall": "CHALLENGE_ID"
}
```

#### Output

```json
{
	"success": true,
	"hint": "HINT_CONTENT"
}
```

#### Remarks

* The `id` field refers to the index of the hint (e.g. the **1**st hint would be ID = 0)

#### Errors

| Error Code   | Definition                                                   |
| ------------ | ------------------------------------------------------------ |
| `notfound`   | The `CHALLENGE_ID` specified was invalid                     |
| `bought`     | This hint has already been bought by the user and can be accessed through `/challenge/show/:chall` |
| `outofrange` | The `id` field is too large or too small (minimum is 0)      |

### `/challenge/submit`

Submit a flag for a challenge  
Authenticated

#### Input

```
{
	"flag": "FLAG_TO_BE_SUBMITTED",
	"chall": "CHALLENGE_ID"
}
```

#### Output

```json
{
	"success": true
}
```

#### Remarks

* The `id` field refers to the index of the hint (e.g. the **1**st hint would be ID = 0)

#### Errors

| Error Code                     | Definition                                                   |
| ------------------------------ | ------------------------------------------------------------ |
| `notfound`                     | The `CHALLENGE_ID` specified was invalid                     |
| `submitted`                    | This challenge was already solved                            |
| `exceeded`                     | The user has already exceeded the maximum number of attempts allowed |
| `ding dong your flag is wrong` | oops                                                         |

#### `/challenge/new`

Create a new challenge  
Authenticated // Permissions: 1

#### Input

```json
{
	"name": "CHALLENGE_NAME",
	"category": "CATEGORY",
	"description": "CHALLENGE_DESCRIPTION (HTML)",
	"points": "POINTS (int)",
	"flags": [
		"FLAG"
	],
	"tags": [
		"TAG"
	],
	"hints": {
		"hint": "HINT",
		"cost": "HINT_COST (int)"
	},
	"max_attempts": "int",
	"visibility": "bool",
}
```

#### Output

```json
{
	"success": true
}
```

#### Remarks

* This endpoint allows duplicate names: should this be allowed? (slows the service down slightly to check)
* File uploads have not been implemented
* Validation: `name`, `category`, `description`, `points`, and at least one `flags` are required fields
* Validation must be done on the client side as the server does not produce meaning output (integers are passed through `parseInt`)

#### Errors

| Error Code    | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to create a new challenge |
| `exists`      | **UNUSED** Another challenge already exists with this name   |
| `validation`  | The input was malformed                                      |

### Miscellaneous

### `/scoreboard`

Get all user score changes with timestamps  
Authenticated

#### Input

```
No input required
```

#### Output

```json
{
	"success": true,
	"scores": [
		{
			"author": "USERNAME_OF_AFFECTED_USER",
			"timestamp": "TIMESTAMP",
			"points": "int (positive or negative)"
		},
		{
			"author": "USERNAME_OF_AFFECTED_USER",
			"timestamp": "TIMESTAMP",
			"points": "int (positive or negative)"
		}
	]
}
```

#### Remarks

* The events are **not sorted by user** and this must be done on the client side
* This endpoint is probably very slow (needs to look through every document)
* `points` is non-zero

