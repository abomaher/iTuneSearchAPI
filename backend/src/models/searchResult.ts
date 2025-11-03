import mongoose, { Schema, Document } from "mongoose";

interface ISearchResult extends Document {
  id: number;
  kind: string;
  artistName: string;
  collectionName: string;
  collectionViewUrl: string;
  image: string;
  searchDate: Date;
}

const searchResultSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  kind: { type: String, required: true },
  artistName: { type: String, required: true },
  collectionName: { type: String, required: true },
  collectionViewUrl: { type: String, required: true },
  image: { type: String, required: false, default: "" },
  searchDate: { type: Date, required: true, default: Date.now },
});

export const searchResultModel = mongoose.model<ISearchResult>("SearchResult", searchResultSchema);