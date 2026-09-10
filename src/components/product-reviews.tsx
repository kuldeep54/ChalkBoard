import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productsAPI, Review } from "../services/api";
import RatingStars from "./rating-stars";
import GoldButton from "./gold-button";
import { useAuth } from "../context/AuthContext";
import {
  formatDate,
  toastInfo,
  toastSuccess,
  toastError,
  getErrorMessage,
} from "../utils/helpers";

export default function ProductReviews({
  productId,
}: {
  productId: string | string[];
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await productsAPI.getReviews(productId);
      setReviews(res.data.reviews);
      setReviewCount(res.data.reviewCount);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    fetchReviews();
  }, [fetchReviews]);

  const openForm = () => {
    if (!isAuthenticated) {
      toastInfo("Sign in required", "Please log in to write a review");
      router.push("/(auth)/login");
      return;
    }
    const mine = reviews.find((r) => r.user._id === user?._id);
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toastError("Error", "Please select a star rating");
      return;
    }
    if (!comment.trim()) {
      toastError("Error", "Please write a short review");
      return;
    }
    setSubmitting(true);
    try {
      await productsAPI.createReview(String(productId), rating, comment.trim());
      toastSuccess(
        "Review submitted",
        "Thanks for sharing your feedback"
      );
      setShowForm(false);
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      toastError("Failed to submit", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-bold text-chalk-ink">Reviews</Text>
          {reviewCount > 0 && (
            <Text className="text-sm text-chalk-slate">({reviewCount})</Text>
          )}
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-1 rounded-full bg-chalk-indigo px-3 py-1.5"
          onPress={openForm}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text className="text-sm font-semibold text-white">
            {reviews.some((r) => r.user._id === user?._id)
              ? "Update Review"
              : "Write a Review"}
          </Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className="mb-4 rounded-2xl border border-chalk-line bg-chalk-mist p-4">
          <Text className="mb-2 text-sm font-semibold text-chalk-ink">
            Your rating
          </Text>
          <View className="mb-3 flex-row gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Ionicons
                  name={rating >= n ? "star" : "star-outline"}
                  size={32}
                  color="#FFA41C"
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            className="min-h-20 rounded-xl border border-chalk-line bg-white p-3 text-base"
            placeholder="What did you like or dislike?"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <GoldButton
            className="mt-3 items-center p-3"
            onPress={handleSubmit}
            disabled={submitting}
            loading={submitting}
          >
            <Text className="text-sm font-bold text-[#111111]">Submit Review</Text>
          </GoldButton>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#232F3E" className="py-6" />
      ) : reviews.length === 0 ? (
        <View className="rounded-2xl border border-chalk-line bg-chalk-mist p-5">
          <Text className="text-center text-sm text-chalk-slate">
            No reviews yet. Be the first to share your feedback.
          </Text>
        </View>
      ) : (
        reviews.map((review) => {
          const isMine = review.user._id === user?._id;
          return (
            <View
              key={review._id}
              className="mb-3 rounded-2xl border border-chalk-line bg-white p-4"
            >
              <View className="mb-1 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-chalk-indigo">
                    <Text className="text-sm font-bold text-white">
                      {review.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-chalk-ink">
                    {review.user.name}
                    {isMine ? " (you)" : ""}
                  </Text>
                </View>
                <Text className="text-xs text-chalk-slate">
                  {formatDate(review.createdAt)}
                </Text>
              </View>
              <RatingStars rating={review.rating} size={14} />
              <Text className="mt-2 text-[15px] leading-6 text-chalk-slate">
                {review.comment}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}