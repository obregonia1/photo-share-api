const expressPlayground = require('graphql-playground-middleware-express').default
const { ApolloServer } = require('apollo-server-express')
const express = require('express')

const { readFileSync } = require('fs')

const typeDefs = readFileSync('./typeDefs.graphql', 'UTF-8')
const resolvers = require('./resolvers')

var app = express()

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers })
  await server.start();
  server.applyMiddleware({ app })
  app.listen({ port: 4000 }, () =>
    console.log(`GraphQL Srver runnning @ http://localhost:4000${server.graphqlPath}`)
  )
}
startServer()

app.get('/playground', expressPlayground({ endpoint: '/graphql' }))
app.get('/', (req, res) => res.end('Welcome to the PhotoShare API'))
