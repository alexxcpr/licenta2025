// Aici vom defini modelul utilizatorului pentru baza de date
// Exemplu pentru Mongoose (MongoDB) - necesită instalarea mongoose

// import mongoose, { Schema, Document } from 'mongoose';
// import bcrypt from 'bcrypt';

/**
 * Interfață pentru utilizator
 */
export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interfață pentru documentul de utilizator (cu metodele adiționale)
 */
export interface IUserDocument extends IUser/*, Document*/ {
  // Metodă pentru compararea parolelor - va fi implementată când adăugi mongoose
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Exemplu de schemă pentru Mongoose - comentată deoarece mongoose nu este instalat încă

/*
const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Un utilizator trebuie să aibă un nume.'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Un utilizator trebuie să aibă un email.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Un utilizator trebuie să aibă o parolă.'],
      minlength: 8,
      select: false // nu se returnează în query-uri
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Criptarea parolei înainte de salvare
userSchema.pre('save', async function(next) {
  // Dacă parola nu a fost modificată, treci la următorul middleware
  if (!this.isModified('password')) return next();
  
  // Criptează parola cu un cost de 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Metodă pentru verificarea parolei
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Exportă modelul
const User = mongoose.model<IUserDocument>('User', userSchema);
export default User;
*/

// Exportă interfețele pentru a fi folosite în aplicație
export default {}; 