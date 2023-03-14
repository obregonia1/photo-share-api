import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ApolloProvider } from 'react-apollo';
import ApolloClient, { gql } from 'apollo-boost';

const client = new ApolloClient({ uri: 'http://localhost:4000/graphql'});

const query = gql`
  query allUsers {
    totalUsers
    allUsers {
      githubLogin
      name
      avatar
    }
  }
`

client.query({query})
  .then(({ data }) => console.log('data', data))
  .catch(console.error)

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
);

console.log('cache', client.extract())
client.query({query})
  .then(() => console.log('cache', client.extract()))
  .catch(console.error)
