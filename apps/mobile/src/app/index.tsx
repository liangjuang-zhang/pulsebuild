import { Text, View, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";

export default function Index() {
  const { data, isLoading, isError, error } = trpc.health.check.useQuery();

  return (
    <View style={styles.container}>
      {isLoading && <Text>Loading...</Text>}
      {isError && <Text style={styles.error}>Error: {error.message}</Text>}
      {data && (
        <>
          <Text style={styles.status}>Status: {data.status}</Text>
          <Text style={styles.timestamp}>
            Timestamp: {new Date(data.timestamp).toLocaleString()}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    fontSize: 18,
    color: "green",
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 14,
    color: "gray",
    marginTop: 8,
  },
  error: {
    fontSize: 14,
    color: "red",
  },
});

