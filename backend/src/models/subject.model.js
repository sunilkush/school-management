import mongoose, { Schema } from "mongoose";

const SubjectSchema = new Schema(
  {
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYears",
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    name: {
      type: String,
      required: true,
      enum: [
        "English", "Science", "History", "Geography", "Art", "Physical Education",
        "Computer Science", "Music", "Economics", "Psychology", "Sociology",
        "Political Science", "Philosophy", "Biology", "Chemistry", "Physics",
        "Literature", "Business Studies", "Accounting", "Statistics",
        "Environmental Science", "Health Education", "Foreign Language", "Drama",
        "Dance", "Media Studies", "Religious Studies", "Ethics", "Law",
        "Engineering", "Architecture", "Astronomy", "Geology", "Anthropology",
        "Linguistics", "Mathematics", "Information Technology", "Robotics",
        "Artificial Intelligence", "Cybersecurity", "Data Science",
        "Machine Learning", "Web Development", "Graphic Design", "Game Development",
        "Network Administration", "Cloud Computing", "Mobile App Development",
        "Digital Marketing", "Project Management", "Supply Chain Management",
        "Human Resource Management", "Finance", "Investment", "Marketing",
        "Public Relations", "Event Management", "Tourism Management",
        "Hospitality Management", "Culinary Arts", "Fashion Design",
        "Interior Design", "Product Design", "Industrial Design", "Textile Design",
        "Jewelry Design", "Graphic Arts", "Photography", "Film Studies",
        "Animation", "Visual Effects", "Sound Engineering", "Music Production",
        "Theater Arts", "Dance Performance", "Choreography", "Creative Writing",
        "Journalism", "Broadcasting", "Public Speaking", "Debate",
        "Forensic Science", "Criminology", "Social Work"
      ],
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Only Users with role = Teacher
      required: true,
    },
    classId: 
      {
        type: Schema.Types.ObjectId,
        ref: "Class",
      },
    
  },
  {
    timestamps: true,
  }
);

export const Subject = mongoose.model("Subject", SubjectSchema);
