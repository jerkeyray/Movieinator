import { icons } from "@/constants/icons";
import { Link } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

const MovieCard = ({ id, poster_path, title, release_date }: Movie) => {
  const year = release_date?.split("-")[0] || "N/A";
  const hasPoster = poster_path && poster_path !== "N/A";

  return (
    <Link href={`/movie/${id}`} asChild>
      <TouchableOpacity className="w-[30%]">
        {hasPoster ? (
          <Image
            source={{ uri: poster_path }}
            className="w-full h-52 rounded-lg"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-52 rounded-lg bg-[#1a1a1a] items-center justify-center p-4">
            <Image
              source={icons.logo}
              className="w-12 h-12 mb-2 opacity-50"
              resizeMode="contain"
            />
            <Text
              className="text-white text-center text-xs opacity-50"
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        )}

        <Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
          {title}
        </Text>

        <Text className="text-xs text-light-300 font-medium mt-1">{year}</Text>
      </TouchableOpacity>
    </Link>
  );
};

export default MovieCard;
