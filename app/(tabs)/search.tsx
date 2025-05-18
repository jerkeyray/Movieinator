import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

import { fetchMovies } from "@/services/api";
import { updateSearchCount } from "@/services/appwrite";
import useFetch from "@/services/useFetch";

import MovieDisplayCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";

const GENRES = [
  { id: "action", name: "Action" },
  { id: "comedy", name: "Comedy" },
  { id: "drama", name: "Drama" },
  { id: "horror", name: "Horror" },
  { id: "sci-fi", name: "Sci-Fi" },
  { id: "thriller", name: "Thriller" },
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  console.log("Current state:", { searchQuery, selectedGenre });

  const {
    data: movies = [],
    loading,
    error,
    refetch: loadMovies,
    reset,
  } = useFetch(
    () => fetchMovies({ query: searchQuery, genre: selectedGenre }),
    false
  );

  const handleSearch = (text: string) => {
    console.log("Search query changed:", text);
    setSearchQuery(text);
  };

  const handleGenreSelect = (genre: string) => {
    console.log("Genre selected:", genre);
    console.log("Current selected genre:", selectedGenre);
    setSelectedGenre(genre === selectedGenre ? null : genre);
  };

  // Debounced search effect
  useEffect(() => {
    console.log("Search effect triggered with:", {
      searchQuery,
      selectedGenre,
    });

    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        console.log("Loading movies for search query");
        await loadMovies();

        // Call updateSearchCount only if there are results
        if (movies?.length! > 0 && movies?.[0]) {
          console.log("Updating search count for:", movies[0]);
          await updateSearchCount(searchQuery, movies[0]);
        }
      } else if (selectedGenre) {
        console.log("Loading movies for selected genre");
        await loadMovies();
      } else {
        console.log("Resetting search results");
        reset();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedGenre]);

  console.log("Current movies data:", movies);
  console.log("Loading state:", loading);
  console.log("Error state:", error);

  return (
    <View className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="flex-1 absolute w-full z-0"
        resizeMode="cover"
      />

      <FlatList
        className="px-5"
        data={movies as Movie[]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MovieDisplayCard {...item} />}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 16,
          marginVertical: 16,
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View className="w-full flex-row justify-center mt-20 items-center">
              <Image source={icons.logo} className="w-12 h-10" />
            </View>

            <View className="my-5">
              <SearchBar
                placeholder="Search for a movie"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <View className="flex-row flex-wrap gap-2 mb-4">
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre.id}
                  onPress={() => handleGenreSelect(genre.id)}
                  className={`px-4 py-2 rounded-full ${
                    selectedGenre === genre.id ? "bg-accent" : "bg-[#1a1a1a]"
                  }`}
                >
                  <Text
                    className={`${
                      selectedGenre === genre.id ? "text-primary" : "text-white"
                    }`}
                  >
                    {genre.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading && (
              <ActivityIndicator
                size="large"
                color="#0000ff"
                className="my-3"
              />
            )}

            {error && (
              <Text className="text-red-500 px-5 my-3">
                Error: {error.message}
              </Text>
            )}

            {!loading &&
              !error &&
              (searchQuery.trim() || selectedGenre) &&
              movies?.length! > 0 && (
                <Text className="text-xl text-white font-bold">
                  {searchQuery.trim() ? (
                    <>
                      Search Results for{" "}
                      <Text className="text-accent">{searchQuery}</Text>
                      {selectedGenre && (
                        <>
                          {" "}
                          in{" "}
                          <Text className="text-accent">
                            {GENRES.find((g) => g.id === selectedGenre)?.name}
                          </Text>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Popular{" "}
                      <Text className="text-accent">
                        {GENRES.find((g) => g.id === selectedGenre)?.name}
                      </Text>{" "}
                      Movies
                    </>
                  )}
                </Text>
              )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View className="mt-10 px-5">
              <Text className="text-center text-gray-500">
                {searchQuery.trim() || selectedGenre
                  ? "No movies found"
                  : "Start typing to search for movies"}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default Search;
