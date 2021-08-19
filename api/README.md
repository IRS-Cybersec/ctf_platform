# API Documentation (0.9.5)

***Last updated on 19/8/2021*** 

## General Notes

The API runs on **(localhost)** port `20001`. 

Please check the CORS settings in `api.js`. By default, CORS is set to allow access from any origin.

```javascript
// Example cors setting if you want to restrict access
app.use(cors({
	credentials: true,
	origin: 'http://localhost'
}));
```
MongoDB **Validation** & **Indexes** are **inserted automatically** at the start if they are not detected inside the DB. Please edit `validators.js` and the indexes at the start if you would like to change anything.

## Responses

### General Response Structure

| Response                                    | Definition                                                   |
| ------------------------------------------- | ------------------------------------------------------------ |
| `{"success": true}`                         | The request was successfully completed                       |
| `{"success": false, "error": "ERROR_CODE"}` | The request was unsuccessful due to the error stated in `error` |

### Error Code Definitions

| Error           | Error Code | Definition                                                   |
| --------------- | ---------- | ------------------------------------------------------------ |
| `unknown`       | 500        | The reason for the failure is not documented                 |
| `missing-token` | 401        | The request did not send an `Authorization` header, but the endpoint is authenticated |
| `wrong-token`   | 401        | The token sent has either expired or been tampered with      |
| `permissions`   | 403        | The user does not have sufficient permissions to run the operation |
| `validation`    | 400        | The input was malformed                                      |

All authenticated endpoints require an `Authorization` header with the token retrieved from the login endpoint.

## Accounts

### `POST /v1/account/create`

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

#### Errors

| Error              | Definition                               |
| -----------------  | ---------------------------------------- |
| `username-taken`   | The username submitted is already in use |
| `email-taken`      | The email submitted is already in use    |
| `email-formatting` | The email submitted was malformed        |

### `POST /v1/account/delete`

Deletes multiple accounts (or own account)  
Authenticated // Permissions: 2 for deleting other accounts

#### Input

```json
{
	"users": ["username1 to delete", "user2"...]
}
```

#### Output

```json
{
	"success": true
}
```

#### Remarks

* If `users` is empty, the own user will be deleted
* `users` can only be defined by a user with permissions level 2
* If `users` is defined, the own user's account cannot be deleted as a precaution
* This endpoint is very slow

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to delete another user |
| `not_found`   | None of the users supplied exist                             |

### `POST /v1/account/taken/username`

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

### `POST /v1/account/taken/email`

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

### `POST /v1/account/login`

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
	"permissions": 0-2 (int from 0-2),
	"token": "TOKEN_STRING"
}
```

#### Remarks
* Do not process the `token`. Store it directly as its format may change without notice.

#### Errors

| Error           | Definition                              |
| --------------- | --------------------------------------- |
| `wrong-details` | The wrong username/password was entered |

### `POST /v1/account/type`

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
	"type": 0-2(int from 0-2)
}
```

#### Errors

```
No special errors
```

### `POST /v1/account/password`

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

### `GET /v1/account/list`

List all accounts  
Authenticated // Permissions: 2

#### Input

```json
None
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

### `POST /v1/account/permissions`

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

### `GET /v1/account/disableStates`

Retrieves the states of the users settings in the admin panel 
Authenticated // Permissions: 2

#### Input

```json
None
```

#### Output

```json
{
	"success": true,
    "states": []
}
```

#### Errors

| Error          | Definition                                                   |
| -------------- | ------------------------------------------------------------ |
| `permissions`  | The logged-in user does not have sufficient permissions to change another user's permission |
| `out-of-range` | `type` is not between 0 to 2                                 |

------

## Challenges

### `GET /v1/challenge/list`

Show all available challenges, sorted by category  
Authenticated

#### Input

```
No input required
```

#### Output

```json
// Type 0 or 1 users
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
					],
                    "requires": "required challenge to unlock this challenge"
				}
			]
		}
	]
}
// Type 2 users
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
					],
                    "requires": "required challenge to unlock this challenge",
                    "visibility": true
				}
			]
		}
	]
}
```

- For admin users (type `2` users), **hidden challenges** are also returned along with a `visibility` property for each challenge  

### `GET /v1/challenge/list/:category`

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
			"solved": "bool",
            "tags": [],
            "requires": "required_challenge_to_solve"
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

### `GET /v1/challenge/list_categories`

Show all available categories  
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
### `GET /v1/challenge/list__all_categories`

Show all categories including hidden ones  
Authenticated // Permissions: 2

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

### `GET /v1/challenge/list_all`

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
			"visibility": true,
            "requires": "chall"
		},
		{
			"name": "CHALLENGE_NAME",
			"category": "CHALLENGE_CATEGORY",
			"points": "int",
			"solves": "array",
			"visibility": true,
            "requires": "chall"
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

### `GET /v1/challenge/show/:chall`

Get the details of a challenge  
Authenticated

#### Input

```
GET: /v1/challenge/show/CHALLENGE_NAME
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

* Only shows challenges with `visibility: true` (unless the user is a type `2` user)
* The endpoint will not return any info if the user has yet to solve the required challenge
* Hints: if the hint has been bought, the object will provide the hint directly. If not, the `cost` key will be an integer of the number of points needed

#### Errors

| Error                              | Definition                                                   |
| ---------------------------------- | ------------------------------------------------------------ |
| `notfound`                         | No challenge found                                           |
| `required-challenge-not-found`     | The required challenge was not found. This likely means that the challenge that should be solved to unlock this challenge has been deleted/no longer exists |
| `required-challenge-not-completed` | The user has yet to completed the required challenge to unlock this challenge |

### `GET /v1/challenge/show/:chall/detailed`

Get all the details of a challenge  
Authenticated // Permissions: 2

#### Input

```
GET: /v1/challenge/show/CHALLENGE_NAME/detailed
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

### `POST /v1/challenge/hint`

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
* Buying a hint triggers a websocket message broadcast to all live scoreboard clients

#### Errors

| Error                              | Definition                                                   |
| ---------------------------------- | ------------------------------------------------------------ |
| `not-found`                        | The `CHALLENGE_NAME` specified was invalid                   |
| `out-of-range`                     | The `id` field is too large or too small (minimum is 0)      |
| `required-challenge-not-found`     | The required challenge was not found. This likely means that the challenge that should be solved to unlock this challenge has been deleted/no longer exists |
| `required-challenge-not-completed` | The user has yet to completed the required challenge to unlock this challenge |

### `POST /v1/challenge/submit`

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

* On a correct solve, this endpoint broadcasts a **websocket msg** to all connected clients to update the scoreboard

#### Errors

| Error                              | Definition                                                   |
| ---------------------------------- | ------------------------------------------------------------ |
| `not-found`                        | The `CHALLENGE_NAME` specified was invalid                   |
| `submitted`                        | This challenge was already solved                            |
| `exceeded`                         | The user has already exceeded the maximum number of attempts allowed |
| `submission-disabled`              | Challenge submission has been disabled by the admin and no new submissions are allowed |
| `required-challenge-not-found`     | The required challenge was not found. This likely means that the challenge that should be solved to unlock this challenge has been deleted/no longer exists |
| `required-challenge-not-completed` | The user has yet to completed the required challenge to unlock this challenge |

### `POST /v1/challenge/new`

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
	"hints": [
		{
			"hint": "HINT",
			"cost": "HINT_COST (int)"
		}
	],
	"max_attempts": "int",
	"visibility": "bool",
    "writeup": "writeup_link",
    "writeupComplete": true, //whether to show writeup only after challenge is solved
    "requires": "required challenge to unlock this challenge"
}
```

#### Output

```json
{
	"success": true
}
```

#### Remarks

* File uploads have not been implemented
* Validation: `name`, `category`, `description`, `points`, and at least one `flags` are required fields
* Validation must be done on the client side as the server does not produce meaning output (integers are passed through `parseInt`)

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to create a new challenge |
| `exists`      | Another challenge already exists with this name              |
| `validation`  | The input was malformed                                      |

### `POST /v1/challenge/edit`

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
    "writeup": "writeup_link",
    "writeupComplete": true, //See /new for info on this property,
    "requires": "required_challenge"
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
* File uploads have not been implemented
* Validation must be done on the client side as the server does not produce meaning output (integers are passed **not** through `parseInt` - perform on client side)

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `notfound`    | The `CHALLENGE_NAME` specified was invalid                   |
| `permissions` | The logged-in user does not have sufficient permissions to edit a challenge |

### `POST /v1/challenge/edit/visibility`

Edit the visibility of a list of challenges  
Authenticated // Permissions: 2

#### Input

```json
{
	"challenges": ["chall1", "chall2"...]
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
| `validation`  | Check that the input is an array                             |

### `POST /v1/challenge/edit/category`

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

### `POST /v1/challenge/delete`

Delete a list of challenges  
Authenticated // Permissions: 2

**Does not delete cleanly**

#### Input
```json
{
	"chall": ["CHALLENGE_NAME", "chall2"...]
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
| `notfound`    | One of the challenges was not found                          |
| `permissions` | The logged-in user does not have sufficient permissions to edit a challenge |

### `GET /v1/challenge/disableStates`

Returns the states of the admin panel challenges settings

Authenticated // Permissions: 2

#### Input

```json
None
```

#### Output

```json
{
	"success": ,
    "states": []
}
```

#### Errors

| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to edit a challenge |

### Miscellaneous

### `GET /v1/scoreboard`

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

### `GET /v1/scores`

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

### `GET /v1/scoreboard/:username`

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

### `GET /v1/scores/:username`

Gets the score of a requested user 
Authenticated

#### Input

```
GET: /v1/scores/USERNAME_OF_USER_TO_CHECK
```

#### Output

```json
{
	"success": true,
	"score": 200
}

// If admin scores are disabled in the admin panel, the following is returned for admins:
{
    "success": true,
    "score": "hidden"
}
```

#### Errors

```
No special errors
```

### `GET /v1/submissions`

Returns all recorded submissions(transactions)  
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
* The submission ID is used to delete submissions

### `POST /adminSettings/`

Change settings in the admin panel (more specifically settings stored in the `cache` collection)  
Authenticated // Permissions: 2

#### Input

```
No input required
```

#### Output

```json
{
	"success": true,
	"setting": "name_of_setting",
    "disable": "setting_value" // This can be a string/integer/boolean
}
```

#### Errors

| Error             | Definition                                                   |
| ----------------- | ------------------------------------------------------------ |
| `permissions`     | The logged-in user does not have sufficient permissions to change settings |
| `invalid-setting` | The setting specified is not a valid setting to be changed   |

#### Remarks

* Please get the initial state of settings from `GET /account/disableStates` and `GET /challenges/disableStates`
* List of valid settings: `["registerDisable", "adminShowDisable", "submissionDisabled", "uploadSize", "uploadPath"]`

### `POST /profile/upload`

Change the user's profile picture to the file specified
Authenticated 

#### Input

```
A multi-part form data with the file data named "profile_pic"
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
| `no-file`     | No file was uploaded/no file data was uploaded with the name "profile_pic" |
| `only-1-file` | More than 1 file was uploaded                                |
| `too-large`   | The specified file was larger than the file size specified in `cache.uploadSize` (in bytes) |
| `invalid-ext` | The file was not an image file of one of the allowed extensions (`.png`, `.jpg`, `.jpeg`, `.webp`) |
| `file-upload` | There was an issue saving the file. Please check that the uploadPath `cache.uploadPath` has sufficient permissions for the script to save the file there |

#### Remarks

* By default, all images are converted to `.webp` and compressed to save space and load faster
* The library used to convert the image to webp, `sharp` seems to have issues working on Windows, please use a Linux machine if possible.

### `POST /v1/submissions/new`

Authenticated // Permissions: 2

#### Input
```json
{
	"username": "USER_TO_CREDIT",
	"chall": "CHALL_NAME",
	"points": int,
	"flag": "(optional) FLAG_TO_BE_RECORDED",
	"force": (optional) bool
}
```

#### Output
```json
{
	"success": true,
	"data": "STRING"
}
```
Data can be any of the following:
* `recorded`: the submission was recorde
* `previous-higher`: the previous score was higher, hence the score was not updated

#### Errors
| Error         | Definition                                                   |
| ------------- | ------------------------------------------------------------ |
| `permissions` | The logged-in user does not have sufficient permissions to create submissions |

#### Remarks
* When `force` is `true`, the API will ignore that the previous submissions had higher scores and will update the score anyways
* This endpoint will be used for datascience challenges

### `WEBSOCKET /`

The websocket is currently only used for live scoreboard updates. Please use `wss` if you have `HTTPS` enabled, and `ws` to connect if you don't.

All messages to/from the server are **JSON-encoded** in the following form:

```json
{
	type: "string",
    data: "any JSON/String etc."
}
```

The communication protocol is likely to change if more websocket features are required

#### Live Scoreboard

- First send an `init` packet 

  ```json
  {type: "init", data: {auth: "USER-TOKEN-FOR-AUTHENTICATION", lastChallengeID: 0 }}
  //lastChallengeID is the ID used for tracking whether the cached challenges are up-to-date
  ```

  - Responses (all with type `init` still)
    - `bad-auth`: User token is wrong
    - `missing-auth`: No `auth` property in `data` was found
    - If it is none of the above, then the endpoint sends scoreboard data to update the cached scoreboard

- Once the initialisation is completed, the client will receive any socket broadcasts from the server

- A `score` packet is sent whenever a new hint is bought/challenge is solved to update the live scoreboard:

  ```json
  { type: "score", data: solveDetails }
  ```

  