import { neo4jgraphql, makeAugmentedSchema } from "neo4j-graphql-js";
import { applyDeepAuth } from "neo4j-deepauth";
import { gql } from "graphql-tag";

const typeDefs = `
type Genre {
   _id: Long!
   name: String!
   movies: [Movie] @relation(name: "IN_GENRE", direction: IN)
}

type User {
   _id: Long!
   name: String!
   userId: String!
   rated: [Movie] @relation(name: "RATED", direction: OUT)
   RATED_rel: [RATED]
}

type Actor {
   _id: Long!
   name: String!
   acted_in: [Movie] @relation(name: "ACTED_IN", direction: OUT)
}

type Director {
   _id: Long!
   name: String!
   directed: [Movie] @relation(name: "DIRECTED", direction: OUT)
}

type AppUser {
   _id: Long!
   hashedPw: String!
   name: String
   refreshToken: String!
   userId: String!
   username: String!
}

type Movie {
   _id: Long!
   countries: [String]
   imdbId: String!
   imdbRating: Float
   imdbVotes: Int
   languages: [String]
   movieId: String!
   plot: String
   poster: String
   released: String
   runtime: Int
   title: String!
   tmdbId: String
   year: Int
   in_genre: [Genre] @relation(name: "IN_GENRE", direction: OUT)
   users: [User] @relation(name: "RATED", direction: IN)
   actors: [Actor] @relation(name: "ACTED_IN", direction: IN)
   directors: [Director] @relation(name: "DIRECTED", direction: IN)
}


type RATED @relation(name: "RATED") {
  from: User!
  to: Movie!
  rating: Float!
  timestamp: Int!
}

directive @deepAuth(
   path: String
   variables: [String]
) on OBJECT | INTERFACE | FIELD_DEFINITION
`;

const resolvers = {
  // root entry point to GraphQL service
  Query: {
    Actor(object, params, ctx, resolveInfo) {
      // No deepauth
      const { authParams, authResolveInfo } = applyDeepAuth(
        params,
        ctx,
        resolveInfo
      );
      return neo4jgraphql(object, authParams, ctx, authResolveInfo);
      // const authResolveInfo = applyDeepAuth(params, ctx, resolveInfo);
      // return neo4jgraphql(object, params, ctx, authResolveInfo);
    },
    Director(object, params, ctx, resolveInfo) {
      // No deepauth
      const { authParams, authResolveInfo } = applyDeepAuth(
        params,
        ctx,
        resolveInfo
      );
      return neo4jgraphql(object, authParams, ctx, authResolveInfo);
      // const authResolveInfo = applyDeepAuth(params, ctx, resolveInfo);
      // return neo4jgraphql(object, params, ctx, authResolveInfo);
    },
    Genre(object, params, ctx, resolveInfo) {
      // Uses deepauth
      const { authParams, authResolveInfo } = applyDeepAuth(
        params,
        ctx,
        resolveInfo
      );
      return neo4jgraphql(object, authParams, ctx, authResolveInfo);
    },
    Movie(object, params, ctx, resolveInfo) {
      // No deepauth
      const { authParams, authResolveInfo } = applyDeepAuth(
        params,
        ctx,
        resolveInfo
      );
      return neo4jgraphql(object, authParams, ctx, authResolveInfo);
      // const authResolveInfo = applyDeepAuth(params, ctx, resolveInfo);
      // return neo4jgraphql(object, params, ctx, authResolveInfo);
    },
    User(object, params, ctx, resolveInfo) {
      // Uses deepauth
      const { authParams, authResolveInfo } = applyDeepAuth(
        params,
        ctx,
        resolveInfo
      );
      return neo4jgraphql(object, authParams, ctx, authResolveInfo);
    },
  },
};

const movieSchema = makeAugmentedSchema({ typeDefs, resolvers });

export { typeDefs, resolvers, movieSchema };
