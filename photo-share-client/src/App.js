import React from 'react';
import Users from './Users';
import { gql } from 'apollo-boost';

export const ROOT_QUERY = gql`
  {
    totalUsers
    allUsers {
      githubLogin
      name
      avatar
    }
  }
`

const App = () => <Users />

export default App;
