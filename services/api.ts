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
  genre,
}: {
  query: string;
  genre?: string | null;
}): Promise<Movie[]> => {
  console.log("Fetching movies with params:", { query, genre });

  let endpoint = query
    ? `${TRAKT_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(
        query
      )}&fields=title`
    : `${TRAKT_CONFIG.BASE_URL}/movies/trending?page=1&limit=20`;

  // Add genre filter if specified
  if (genre) {
    endpoint = `${TRAKT_CONFIG.BASE_URL}/movies/popular?genres=${genre}&page=1&limit=20`;
    console.log("Using genre endpoint:", endpoint);
  }

  console.log("Final endpoint:", endpoint);

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TRAKT_CONFIG.headers,
  });

  if (!response.ok) {
    console.error("API Error:", response.statusText);
    throw new Error(`Failed to fetch movies: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Raw API Response:", JSON.stringify(data, null, 2));

  // Normalize Trakt response based on endpoint type
  let movies;
  if (query) {
    // Search response format - each item has a movie property
    movies = data
      .map((item: any) => {
        if (!item.movie) {
          console.warn("Invalid search result item:", item);
          return null;
        }
        return item.movie;
      })
      .filter(Boolean); // Remove any null items
  } else if (genre) {
    // Genre response format - direct array of movies
    movies = data;
  } else {
    // Trending response format - each item has a movie property
    movies = data
      .map((item: any) => {
        if (!item.movie) {
          console.warn("Invalid trending result item:", item);
          return null;
        }
        return item.movie;
      })
      .filter(Boolean); // Remove any null items
  }

  console.log("Normalized movies array:", JSON.stringify(movies, null, 2));

  // Enhance with OMDb posters
  return await Promise.all(
    movies.map(async (movie: any) => {
      if (!movie) {
        console.warn("Skipping null movie");
        return null;
      }

      console.log("Processing movie:", JSON.stringify(movie, null, 2));
      let poster_path: string | null = null;

      // Handle different movie object structures
      const movieId = movie.ids?.trakt || movie.id;
      const imdbId = movie.ids?.imdb || movie.ids?.imdb_id;

      if (!movieId) {
        console.warn("Movie missing ID:", movie);
        return null;
      }

      if (imdbId) {
        try {
          const omdbRes = await fetch(
            `${OMDB_CONFIG.BASE_URL}/?i=${imdbId}&apikey=${OMDB_CONFIG.API_KEY}`
          );
          const omdbData = await omdbRes.json();
          if (
            omdbData?.Response === "True" &&
            omdbData?.Poster &&
            omdbData?.Poster !== "N/A"
          ) {
            poster_path = omdbData.Poster;
          }
        } catch (err) {
          console.warn(`OMDb poster fetch failed for IMDb ID ${imdbId}:`, err);
        }
      }

      const processedMovie = {
        id: movieId,
        title: movie.title,
        release_date:
          movie.released ?? (movie.year ? `${movie.year}-01-01` : null),
        overview: movie.overview ?? "No overview available.",
        poster_path,
        vote_average: movie.rating ? Number((movie.rating * 2).toFixed(1)) : 0,
        vote_count: movie.votes ?? 0,
        genres: movie.genres || [],
      };
      console.log(
        "Final processed movie:",
        JSON.stringify(processedMovie, null, 2)
      );
      return processedMovie;
    })
  ).then((movies) => movies.filter(Boolean)); // Remove any null movies
};

export const fetchMovieDetails = async (
  movieId: string
): Promise<MovieDetails> => {
  try {
    console.log("Fetching movie details for ID:", movieId);
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
    console.log("Trakt API Response:", JSON.stringify(data, null, 2));

    // OMDb Enhancements
    let poster_path: string | null = null;
    let actors: string[] | undefined;
    let director: string | undefined;
    let budget: number = 0;
    let revenue: number = 0;
    let production_companies: any[] = [];

    if (data?.ids?.imdb) {
      try {
        console.log("Fetching OMDb data for IMDb ID:", data.ids.imdb);
        const omdbRes = await fetch(
          `${OMDB_CONFIG.BASE_URL}/?i=${data.ids.imdb}&apikey=${OMDB_CONFIG.API_KEY}&plot=full`
        );
        const omdbData = await omdbRes.json();
        console.log("OMDb API Response:", JSON.stringify(omdbData, null, 2));

        if (omdbData?.Response === "True") {
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

          // Parse budget and revenue from OMDb
          if (omdbData.BoxOffice && omdbData.BoxOffice !== "N/A") {
            const boxOffice = omdbData.BoxOffice.replace(/[^0-9]/g, "");
            revenue = parseInt(boxOffice) || 0;
            console.log("Parsed revenue:", revenue);
          }

          // Parse budget from OMDb
          if (omdbData.Budget && omdbData.Budget !== "N/A") {
            const budgetStr = omdbData.Budget.replace(/[^0-9]/g, "");
            budget = parseInt(budgetStr) || 0;
            console.log("Parsed budget:", budget);
          }
        }
      } catch (err) {
        console.warn(
          `OMDb details fetch failed for IMDb ID ${data.ids.imdb}:`,
          err
        );
      }
    }

    // Map genres from Trakt data
    const genres = data.genres
      ? data.genres.map((genre: string) => ({
          id: 0, // Trakt doesn't provide genre IDs
          name: genre,
        }))
      : [];

    // Create production companies array from Trakt data
    if (data.studio) {
      production_companies = [
        {
          id: 0,
          logo_path: null,
          name: data.studio,
          origin_country: "",
        },
      ];
    }

    const movieDetails: MovieDetails = {
      id: data.ids.trakt,
      title: data.title,
      release_date: data.released ?? `${data.year}-01-01`,
      overview: data.overview ?? "No overview available.",
      genres,
      runtime: data.runtime ?? 0,
      vote_average: data.rating ?? 0,
      tagline: data.tagline ?? "",
      poster_path,
      actors,
      director,
      ids: data.ids,
      adult: false,
      backdrop_path: null,
      belongs_to_collection: null,
      budget,
      homepage: null,
      imdb_id: data.ids.imdb,
      original_language: data.language ?? "en",
      original_title: data.title,
      popularity: 0,
      production_companies,
      production_countries: [],
      revenue,
      spoken_languages: [],
      status: "Released",
      video: false,
      vote_count: data.votes ?? 0,
    };

    console.log(
      "Final processed movie details:",
      JSON.stringify(movieDetails, null, 2)
    );
    return movieDetails;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
};
