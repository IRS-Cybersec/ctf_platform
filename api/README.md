# API Documentation (v1)

**API v1 is still unstable**

The API runs on port `20001`. Please check the CORS settings in `api.js`:

```javascript
app.use(cors({
	credentials: true,
	origin: 'http://localhost'
}));
```
All authenticated endpoints require an `Authorization` header with the token retrieved from the login endpoint.

_It has not been ascertained that the `.find()` method returns _all_ results. Create a GitHub issue if the responses seem to be limited to the first 20._

## Common Responses

| Response                                    | Definition                                                   |
| ------------------------------------------- | ------------------------------------------------------------ |
| `{"success": true}`                         | The request was successfully completed                       |
| `{"success": false, "error": "ERROR_CODE"}` | The request was unsuccessful due to the error stated in `error` |

| Error           | Error Code | Definition                                                   |
| --------------- | ---------- | ------------------------------------------------------------ |
| `unknown`       | 500        | The reason for the failure is not documented                 |
| `missing-token` | 401        | The request did not send an `Authorization` header, but the endpoint is authenticated |
| `wrong-token`   | 401        | The token sent has either expired or been tampered with      |
| `permissions`   | 403        | The user does not have sufficient permissions to run the operation |
| `validation`    | 400        | The input was malformed                                      |

## Accounts

### `/v1/account/create`

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

| Error              | Definition                               |
| -----------------  | ---------------------------------------- |
| `username-taken`   | The username submitted is already in use |
| `email-taken`      | The email submitted is already in use    |
| `email-formatting` | The email submitted was malformed        |

### `/v1/account/delete`

Deletes an account  
Authenticated // Permissions: 2 for some features

#### Input

```json
{
	"username": "USERNAME OF USER TO BE DELETED (optional)"
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
* This endpoint is very slow

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to delete another user |
| `not_found`   | The username supplied does not exist                         |

### `/v1/account/taken/username`

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
No special errors
```

### `/v1/account/taken/email`

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
No special errors
```

### `/v1/account/login`

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
	"permissions": "int from 0-2",
	"token": "TOKEN_STRING"
}
```

#### Remarks
* Do not process the `token`. Store it directly as its format may change without notice.

#### Errors

| Error            | Definition                           |
| ---------------- | ------------------------------------ |
| `wrong-username` | The username submitted was not found |
| `wrong-password` | The password submitted was wrong     |

### `/v1/account/type`

Returns the updated permissions level of the logged-in user  
Authenticated

#### Input

```
No input required
```

#### Output

```json
{
	"success": true,
	"type": "int from 0-2"
}
```

#### Errors

```
No special errors
```

### `/v1/account/password`

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

| Error            | Definition                                           |
| ---------------- | ---------------------------------------------------- |
| `not-found`      | The username specified was not found                 |
| `empty-password` | The `new_password` field is empty                    |
| `wrong-password` | The `password` field does not match the old password |

### `/v1/account/list`

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

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to list all users |

### `/v1/account/permissions`

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

| Error          | Definition                                                   |
| -------------- | ------------------------------------------------------------ |
| `permissions`  | The logged-in user does not have sufficient permissions to change another user's permission |
| `out-of-range` | `type` is not between 0 to 2                                 |

## Challenges

### `/v1/challenge/list`

Show all available challenges, sorted by category  
Authenticated

#### Input

```
No input required
```

#### Output

```json
{
	"success": true,
	"data": [
		{
			"_id": "CATEGORY_NAME",
			"challenges": [
				{
					"name": "CHALLENGE_NAME",
					"points": "int",
					"solved": "bool",
					"tags": [
						"CHALLENGE_TAGS"
					]
				}
			]
		}
	]
}
```

### `/v1/challenge/list/:category`

Show all available challenges in a category  
Authenticated

#### Input

```
GET /v1/challenge/list/CATEGORY_NAME
```

```json
{
	"success": true,
	"challenges": [
		{
			"name": "CHALLENGE_NAME",
			"points": "int",
			"solved": "bool"
		}
	]
}
```

#### Remarks

* Only shows challenges with `visibility: true`

#### Errors

| Error       | Definition                                                    |
| ----------- | ------------------------------------------------------------- |
| `not-found` | No challenges were found (matching the criteria if specified) |

### `/v1/challenge/list_categories`

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
	"categories": [
		"NEW_CATEGORIES",
		"OTHER_NEW_CATEGORIES"
	]
}
```

#### Remarks

* Only shows challenges with `visibility: true`

#### Errors

```
No special errors

```
### `/v1/challenge/list_all`

Show all challenges  
Authenticated // Permissions: 2

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
			"name": "CHALLENGE_NAME",
			"category": "CHALLENGE_CATEGORY",
			"points": "int",
			"solves": "array",
			"visibility": true
		},
		{
			"name": "CHALLENGE_NAME",
			"category": "CHALLENGE_CATEGORY",
			"points": "int",
			"solves": "array",
			"visibility": true
		}
	]
}
```

#### Remarks

* Shows all challenges, including those with `visibility: false`

#### Errors

```
No special errors
```

### `/v1/challenge/show/:chall`

Get the details of a challenge  
Authenticated

#### Input

```
GET: /v1/account/show/CHALLENGE_NAME
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
				"bought": true,
				"hint": "HINT_CONTENTS" // hint 1
			},
			{
				"bought": false,
				"cost": "int" // hint 2
			}
		]
	}
}
```

#### Remarks

* Only shows challenges with `visibility: true`
* Missing information: number of attempts used up
* Hints: if the hint has been bought, the object will provide the hint directly. If not, the `cost` key will be an integer of the number of points needed

#### Errors

```
No special errors
```

### `/v1/challenge/show/:chall/detailed`

Get all the details of a challenge  
Authenticated // Permissions: 2

#### Input

```
GET: /v1/account/score/CHALLENGE_NAME/detailed
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
		"used_attempts": "int",
		"tags": [
			"CHALLENGE_TAG"
		],
		"visibility": "bool",
		"flags": [
			"FLAG"
		],
		"hints": [
			{
				"hint": "HINT_CONTENTS",
				"cost": "int",
				"purchased": [
					"USERNAME"
				]
			},
			{
				"hint": "HINT_CONTENTS",
				"cost": "int",
				"purchased": [
					"USERNAME"
				]
			}
		]
	}
}
```

#### Errors
| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to create a new challenge |

### `/v1/challenge/hint`

Buy a hint for a challenge  
Authenticated

#### Input

```
{
	"id": "int",
	"chall": "CHALLENGE_NAME"
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
* The server will return the hint if it has already been bought, but will not deduct any points

#### Errors

| Error          | Definition                                                   |
| -------------- | ------------------------------------------------------------ |
| `not-found`    | The `CHALLENGE_NAME` specified was invalid                   |
| `out-of-range` | The `id` field is too large or too small (minimum is 0)      |

### `/v1/challenge/submit`

Submit a flag for a challenge  
Authenticated

#### Input

```
{
	"flag": "FLAG_TO_BE_SUBMITTED",
	"chall": "CHALLENGE_NAME"
}
```

#### Output

```json
{
	"success": true,
	"data": "correct/ding dong your flag is wrong"
}
```

#### Remarks

* The `id` field refers to the index of the hint (e.g. the **1**st hint would be ID = 0 this isn't Lua)

#### Errors

| Error       | Definition                                                   |
| ----------- | ------------------------------------------------------------ |
| `not-found` | The `CHALLENGE_NAME` specified was invalid                   |
| `submitted` | This challenge was already solved                            |
| `exceeded`  | The user has already exceeded the maximum number of attempts allowed |

#### `/v1/challenge/new`

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

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to create a new challenge |
| `exists`      | **UNUSED** Another challenge already exists with this name   |
| `validation`  | The input was malformed                                      |

### `/v0/challenge/visibility/chall`

**DEPRECATED. USE `/v1/challenge/edit` INSTEAD**

Set the visibility of a challenge  
Authenticated // Permissions: 2

#### Input

```
{
	"visibility": "bool",
	"chall": "CHALLENGE_NAME"
}
```

#### Output

```json
{
	"success": true
}
```

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `not-found`   | The `CHALLENGE_NAME` specified was invalid                   |
| `permissions` | The logged-in user does not have sufficient permissions to change a challenge visibility |

### `/v0/challenge/visibility/category`

**DEPRECATED. USE `/v1/challenge/edit/category` INSTEAD**

Set the visibility of all challenges in a category  
Authenticated // Permissions: 2

#### Input

```
{
	"visibility": "bool",
	"category": "CATEGORY_NAME"
}
```

#### Output

```json
{
	"success": true
}
```

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `notfound`    | The `CHALLENGE_NAME` specified was invalid                   |
| `permissions` | The logged-in user does not have sufficient permissions to change a challenge visibility |

### `/v1/challenge/edit`

Edit a challenge  
Authenticated // Permissions: 2

#### Input
```json
{
	"chall": "CHALLENGE_NAME",
	"name": "NEW_CHALLENGE_NAME",
	"category": "NEW_CATEGORIES",
	"description": "NEW_CHALLENGE_DESCRIPTION (HTML)",
	"points": "NEW_POINTS (int)",
	"flags": [
		"NEW_FLAG"
	],
	"tags": [
		"NEW_TAG"
	],
	"hints": [{
		"hint": "NEW_HINT",
		"cost": "NEW_HINT_COST (int)",
		"purchased": [
			"USERNAME (required, even if empty)"
		]
	}],
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

* All fields other than `chall` are optional.
* **All entries must be filled with the original data as well**
  * e.g. to add a new flag, input `["old flag", "new flag"]`
  * Deletes hint purchases **without compensation** if this is not done (but can also be used to award hints to users)
* No way to edit solves yet
* This endpoint allows duplicate names: should this be allowed? (slows the service down slightly to check)
* File uploads have not been implemented
* Validation must be done on the client side as the server does not produce meaning output (integers are passed **not** through `parseInt` - perform on client side)

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `notfound`    | The `CHALLENGE_NAME` specified was invalid                   |
| `permissions` | The logged-in user does not have sufficient permissions to edit a challenge |

### `/v1/challenge/edit/category`

Edit a category's metadata  
Authenticated // Permissions: 2

#### Input
```
{
	"category": "CATEGORY_NAME",
	"new_name": "NEW_CATEGORY_NAME (optional)",
	"visibility": "bool (optional)"
}
```
#### Output

```json
{
	"success": true
}
```

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `notfound`    | The `CHALLENGE_NAME` specified was invalid                   |
| `permissions` | The logged-in user does not have sufficient permissions to edit a challenge |

### `/v1/challenge/edit`

Edit a challenge  
Authenticated // Permissions: 2

#### Input
```json
{
	"chall": "CHALLENGE_NAME"
}
```

#### Output

```json
{
	"success": true
}
```

### `/v1/challenge/dekete`

Delete a challenge  
Authenticated // Permissions: 2

**Does not delete cleanly**

#### Input
```json
{
	"chall": "CHALLENGE_NAME"
}
```

#### Output

```json
{
	"success": true
}
```

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `notfound`    | The `CHALLENGE_NAME` specified was invalid                   |
| `permissions` | The logged-in user does not have sufficient permissions to edit a challenge |

### Miscellaneous

### `/v1/scoreboard`

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
			"author": "USERNAME_OF_USER",
			"timestamp": "TIMESTAMP",
			"points": "int (positive or negative)"
		},
		{
			"author": "USERNAME_OF_USER",
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

### `/v1/scores`

Get all user scores  
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
			"username": "USERNAME_OF_USER",
			"points": "int"
		},
		{
			"author": "USERNAME_OF_USER",
			"points": "int"
		}
	]
}
```

### `/v1/scoreboard/:username`

Returns the score history of a requested user  
Authenticated

#### Input

```
GET: /v1/scoreboard/USERNAME_OF_USER_TO_CHECK
```

#### Output

```json
{
	"success": true,
	"scores": [
		{
			"challenge": "CHALLENGE_NAME",
			"type": "submission/hint",
			"timestamp": "TIMESTAMP",
			"points": "int"
		},
		{
			"challenge": "CHALLENGE_NAME",
			"type": "submission/hint",
			"timestamp": "TIMESTAMP",
			"points": "int"
		}
	]
}
```

#### Errors

```
No special errors
```

### `/v1/scores/:username`

Get all user scores  
Authenticated

#### Input

```
GET: /v1/scoreboard/USERNAME_OF_USER_TO_CHECK
```

#### Output

```json
{
	"success": true,
	"scores": 200
}
```

#### Remarks

* The `not-found` error **has not** been implemented yet.

#### Errors

```
No special errors
```

### `/v1/submissions`

Returns all recorded submissions  
Authenticated // Permissions: 2

#### Input

```
No input required
```

#### Output

```json
{
	"success": true,
	"submissions": [
		{
			"_id": "SUBMISSION_ID (like 5ed326c62d0f6f32a834f049)",
			"author": "SUBMITTOR",
			"challenge": "CHALLENGE_NAME",
			"timestamp": "TIMESTAMP",
			"type": "submission/blocked_submission",
			"points": "int",
			"correct": "bool",
			"submission": "SUBMITTED_FLAG"
		}
	]
}
```

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to view submissions |

#### Remarks
* The submission ID is kinda useless