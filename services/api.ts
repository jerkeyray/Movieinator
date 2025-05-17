const TRAKT_CONFIG = {
  BASE_URL: "https://api.trakt.tv",
  CLIENT_ID: process.env.EXPO_PUBLIC_TRAKT_CLIENT_ID,
  headers: {
    accept: "application/json",
    "trakt-api-version": "2",
    "trakt-api-key": process.env.EXPO_PUBLIC_TRAKT_CLIENT_ID as string,
  },
};

const OMDB_CONFIG = {
  BASE_URL: "http://www.omdbapi.com",
  API_KEY: process.env.EXPO_PUBLIC_OMDB_API_KEY,
};

export const fetchMovies = async ({
  query,
}: {
  query: string;
}): Promise<Movie[]> => {
  const endpoint = query
    ? `${TRAKT_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(
        query
      )}&fields=title`
    : `${TRAKT_CONFIG.BASE_URL}/movies/trending?page=1&limit=20`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TRAKT_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch movies: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize Trakt response
  const movies = query
    ? data.map((item: any) => item.movie)
    : data.map((item: any) => item.movie);

  // Enhance with OMDb posters
  return await Promise.all(
    movies.map(async (movie: any) => {
      let poster_path = null;
      if (movie.ids.imdb) {
        try {
          const omdbResponse = await fetch(
            `${OMDB_CONFIG.BASE_URL}/?i=${movie.ids.imdb}&apikey=${OMDB_CONFIG.API_KEY}`
          );
          const omdbData = await omdbResponse.json();
          poster_path =
            omdbData.Response === "True" &&
            omdbData.Poster &&
            omdbData.Poster !== "N/A"
              ? omdbData.Poster
              : null;
        } catch (omdbError) {
          console.warn(
            `OMDb poster fetch failed for IMDb ID ${movie.ids.imdb}:`,
            omdbError
          );
        }
      }
      return {
        id: movie.ids.trakt,
        title: movie.title,
        release_date: movie.released,
        overview: movie.overview,
        poster_path,
      };
    })
  );
};

export const fetchMovieDetails = async (
  movieId: string
): Promise<MovieDetails> => {
  try {
    const response = await fetch(
      `${TRAKT_CONFIG.BASE_URL}/movies/${movieId}?extended=full`,
      {
        method: "GET",
        headers: TRAKT_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.statusText}`);
    }

    const data = await response.json();

    // Fetch OMDb data for poster and additional details
    let poster_path = null;
    let actors: string[] | undefined;
    let director: string | undefined;

    if (data.ids.imdb) {
      try {
        const omdbResponse = await fetch(
          `${OMDB_CONFIG.BASE_URL}/?i=${data.ids.imdb}&apikey=${OMDB_CONFIG.API_KEY}`
        );
        const omdbData = await omdbResponse.json();
        if (omdbData.Response === "True") {
          poster_path =
            omdbData.Poster && omdbData.Poster !== "N/A"
              ? omdbData.Poster
              : null;
          actors =
            omdbData.Actors && omdbData.Actors !== "N/A"
              ? omdbData.Actors.split(", ")
              : undefined;
          director =
            omdbData.Director && omdbData.Director !== "N/A"
              ? omdbData.Director
              : undefined;
        }
      } catch (omdbError) {
        console.warn(
          `OMDb details fetch failed for IMDb ID ${data.ids.imdb}:`,
          omdbError
        );
      }
    }

    // Normalize Trakt + OMDb response
    return {
      id: data.ids.trakt,
      title: data.title,
      release_date: data.released,
      overview: data.overview,
      genres: data.genres,
      runtime: data.runtime,
      vote_average: data.rating,
      tagline: data.tagline,
      poster_path,
      actors,
      director,
      ids: data.ids,
      adult: false,
      backdrop_path: null,
      belongs_to_collection: null,
      budget: 0,
      homepage: null,
      imdb_id: data.ids.imdb,
      original_language: data.language || "en",
      original_title: data.title,
      popularity: 0,
      production_companies: [],
      production_countries: [],
      revenue: 0,
      spoken_languages: [],
      status: "Released",
      video: false,
      vote_count: 0,
    };
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
};
