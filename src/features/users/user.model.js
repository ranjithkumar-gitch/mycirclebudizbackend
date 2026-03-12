import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    firstName: {
      type: String,
      default: null,
      trim: true,
    },
    lastName: {
      type: String,
      default: null,
      trim: true,
    },
    email: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: null,
    },
    profilePhoto: {
      type: String,
      default: null,
    },

    //Mcb code should be generated in backend and returned in response after profile completion. It should be unique across all users. It should be shown in QR code and can be used by other users to follow the profile.and format should be like MCB0001
    mcbCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: null,
    },
    //QRCodeImage should be generated based on mcbCode and stored as a URL or base64 string
    QRCodeImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      default: null,  
      trim: true,
    },
    city: { 
      type: String,
      default: null,
      trim: true,
    },
    district: {
      type: String,
      default: null,  
      trim: true,
    },
    state: {
      type: String,   
      default: null,
      trim: true,
    },      
    pincode: {
      type: String,
      default: null,
      trim: true,
    },
  },  
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
