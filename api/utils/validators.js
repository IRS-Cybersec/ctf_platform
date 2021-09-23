const users = {
    $jsonSchema: {
      required: [
        'username',
        'email',
        'password',
        'type'
      ],
      properties: {
        username: {
          bsonType: 'string'
        },
        email: {
          bsonType: 'string'
        },
        password: {
          bsonType: 'string'
        },
        type: {
          bsonType: 'int',
          minimum: 0,
          maximum: 2,
          exclusiveMaximum: false
        }
      }
    }
  }
const transactions = {
    $jsonSchema: {
      required: [
        'author',
        'challenge',
        'timestamp',
        'type',
        'points'
      ],
      properties: {
        author: {
          bsonType: 'string'
        },
        challenge: {
          bsonType: 'string'
        },
        timestamp: {
          bsonType: 'date'
        },
        type: {
          bsonType: 'string',
          'enum': [
            'submission',
            'hint',
            'blocked_submission',
            'challenge_update',
            'initial_register'
          ]
        },
        points: {
          bsonType: 'int'
        },
        correct: {
          bsonType: 'bool'
        },
        submission: {
          bsonType: 'string'
        },
        reason: {
          bsonType: 'string'
        },
        hint_id: {
          bsonType: 'int',
          minimum: 0
        },
        lastChallengeID: {
          bsonType: 'int'
        }
      }
    }
  }
const challs = {
    $jsonSchema: {
      required: [
        'name',
        'category',
        'description',
        'points',
        'max_attempts',
        'flags',
        'solves',
        'visibility',
        'author',
        'created'
      ],
      properties: {
        name: {
          bsonType: 'string'
        },
        category: {
          bsonType: 'string'
        },
        tags: {
          bsonType: 'array',
          minItems: 1,
          uniqueItems: true,
          items: {
            bsonType: 'string'
          }
        },
        hints: {
          bsonType: 'array',
          uniqueItems: true,
          items: {
            bsonType: 'object',
            required: [
              'hint',
              'cost',
              'purchased'
            ],
            additionalProperties: false,
            properties: {
              hint: {
                bsonType: 'string'
              },
              cost: {
                bsonType: 'int'
              },
              purchased: {
                bsonType: 'array',
                items: {
                  bsonType: 'string'
                }
              }
            }
          }
        },
        description: {
          bsonType: 'string'
        },
        points: {
          bsonType: 'int'
        },
        max_attempts: {
          bsonType: 'int'
        },
        visibility: {
          bsonType: 'bool'
        },
        flags: {
          bsonType: 'array',
          minItems: 1,
          uniqueItems: true,
          items: {
            bsonType: 'string'
          }
        },
        files: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: [
              'url',
              'name'
            ]
          }
        },
        solves: {
          bsonType: 'array',
          minItems: 0,
          uniqueItems: true,
          items: {
            bsonType: 'string'
          }
        },
        author: {
          bsonType: 'string'
        },
        created: {
          bsonType: 'date'
        }
      }
    }
  }
module.exports = {
    users, transactions, challs
}