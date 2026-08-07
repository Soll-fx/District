-- Course: курсы Академии (LMS)
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "lessons" INTEGER NOT NULL,
    "done" INTEGER NOT NULL DEFAULT 0,
    "time" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
