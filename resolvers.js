const { authorizeWithGithub } = require('./lib')
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
        .toArrray(),

    totalUsers: (parent, args, { db }) =>
      db.collection('users')
        .estimatedDocumentCount(),

    allUsers: (parent, args, { db }) =>
      db.collection('users')
        .find()
        .toArrray()
  },

  Mutation: {
    postPhoto(parent, args) {
      var newPhoto = {
        id: _id++,
        ...args.input,
        created: new Date()
      }
      photos.push(newPhoto)
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
  },

  Photo: {
    url: parent => `http://yoursite.com/img/${parent.id}.jpg`,
    postedBy: parent => {
      return users.find(u => u.githubLogin === parent.githubUser)
    },
    taggedUsers: parent => tags.filter(tag => tag.photoID === parent.id)
                               .map(tag => tag.userID)
                               .map(userID => users.find(u => u.githubLogin === userID))
    },
  User: {
    postedPhotos: parent => {
      return photos.filter(p => p.githubUser === parent.githubLogin)
    },
    inPhotos: parent => tags
      .filter(tag => tag.userID === parent.id)
      .map(tag => tag.photoID)
      .map(photoID => photos.find(p => p.id === photoID))
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
