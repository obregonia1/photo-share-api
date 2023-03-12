const { authorizeWithGithub } = require('./lib')
const fetch = require('node-fetch')
require('dotenv').config()

module.exports = {
  Query: {
    me: (parent, args, { currentUser }) => currentUser,

    totalPhotos: (parent, args, { db }) =>
      db.collection('photos')
        .estimatedDocumentCount(),

    allPhotos: (parent, args, { db }) =>
      db.collection('photos')
        .find()
        .toArray(),

    totalUsers: (parent, args, { db }) =>
      db.collection('users')
        .estimatedDocumentCount(),

    allUsers: (parent, args, { db }) =>
      db.collection('users')
        .find()
        .toArray()
  },

  Mutation: {
    async postPhoto(parent, args, { db, currentUser }) {
      if (!currentUser) {
        throw new Error('only an authrized user can post a photo')
      }

      const newPhoto = {
        ...args.input,
        userID: currentUser.githubLogin,
        created: new Date()
      }

      const { insertedId } = await db.collection('photos').insertOne(newPhoto)
      newPhoto.id = insertedId

      return newPhoto
    },

    async githubAuth(parent, { code }, { db }) {
      let {
        message,
        access_token,
        avatar_url,
        login,
        name
      } = await authorizeWithGithub({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })

      if (message) {
        throw new Error(message)
      }

      let user = {
        name,
        githubLogin: login,
        githubToken: access_token,
        avatar: avatar_url
      }

      const result = await db
        .collection('users')
        .replaceOne({ githubLogin: login }, user, { upsert: true })

      return { user, token: access_token }
    },

    addFakeUsers: async (root, { count }, { db }) => {
      var randomUserApi = `https://randomuser.me/api/?results=${count}`

      var { results } = await fetch(randomUserApi)
        .then(res => res.json())

      var users = results.map(r => ({
        githubLogin: r.login.username,
        name: `${r.name.first} ${r.name.last}`,
        avatar: r.picture.thumbail,
        githubToken: r.login.sha1
      }))

      await db.collection('users').insertMany(users)

      return users
    },

    async fakeUserAuth (parent, { githubLogin }, { db }) {
      var user = await db.collection('users').findOne({ githubLogin })

      if(!user) {
        throw new Error(`Cannnot find user with githubLogin ${githubLogin}`)
      }

      return {
        token: user.githubToken,
        user
      }
    }
  },

  Photo: {
    id: parent => parent.id || parent._id,
    url: parent => `/img/photos/${parent._id}.jpg`,
    postedBy: (parent, args, { db }) => {
      db.collection('users').findOne({ githubLogin: parent.userID })
    },
    // taggedUsers: parent => tags.filter(tag => tag.photoID === parent.id)
    //                            .map(tag => tag.userID)
    //                            .map(userID => users.find(u => u.githubLogin === userID))
  },
  User: {
    postedPhotos: (parent, args, { db }) =>
        db.collection("photos")
            .find({ userID: parent.githubLogin })
            .toArray(),
    // postedPhotos: parent => {
    //   return photos.filter(p => p.githubUser === parent.githubLogin)
    // },
    // inPhotos: parent => tags
    //   .filter(tag => tag.userID === parent.id)
    //   .map(tag => tag.photoID)
    //   .map(photoID => photos.find(p => p.id === photoID))
  },
  // DateTime: new GraphQLScalarType({
  //   name: 'DateTime',
  //   description: 'A valid date time value.',
  //   parseValue: value => new Date(value),
  //   serialize: value => new Date(value).toISOString(),
  //   parseLiteral: ast => ast.value
  // })

// }
}
