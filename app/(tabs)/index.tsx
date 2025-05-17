import SearchBar from "@/components/SearchBar";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { fetchMovies } from "@/services/api";
import useFetch from "@/services/useFetch";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function Index() {
  const router = useRouter();

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
  } = useFetch(() =>
    fetchMovies({
      query: "",
    })
  );

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="absolute w-full z-0" />

      <ScrollView className="flex-1 px-5 showsVerticalScrollIndicator-none contentContainerStyle={{minHeight: '100%', paddingBottom: 10}}">
        <Image source={icons.logo} className="w-20 h-20 mt-20 mb-5 mx-auto" />

        {moviesLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator
              size="large"
              color="#0000ff"
              className="mt-10 self-center"
            />
          </View>
        ) : moviesError ? (
          <Text>Error: {moviesError?.message}</Text>
        ) : (
          <View className="flex-1 items-center justify-center">
            <SearchBar
              onPress={() => {
                router.push("/search");
              }}
              placeholder="Search for a movie"
            />
            <Text className="text-lg font-bold text-white mt-5 mb-3">
              Latest Movies
            </Text>

            <FlatList
              data={movies}
              renderItem={({ item }) => (
                <Text className="text-white text-sm">{item.title}</Text>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              numColumns={3}
              columnWrapperStyle={{
                justifyContent: "flex-start",
                gap: 20, 
                paddingRight: 5,
                marginBottom: 10
              }}
              className="mt-2 pb-32"
              scrollEnabled={false}
            />
          </View>
        )}


      </ScrollView>
    </View>
  );
}
