-- CreateTable
CREATE TABLE "employee_work_hours" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hours_worked" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "employee_id" TEXT NOT NULL,
    "shift_id" TEXT,
    "department_id" TEXT NOT NULL,

    CONSTRAINT "employee_work_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_records" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "department_id" TEXT NOT NULL,

    CONSTRAINT "waste_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paint_records" (
    "id" TEXT NOT NULL,
    "paint_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "department_id" TEXT NOT NULL,
    "employee_id" TEXT,

    CONSTRAINT "paint_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_work_hours_employee_id_idx" ON "employee_work_hours"("employee_id");

-- CreateIndex
CREATE INDEX "employee_work_hours_date_idx" ON "employee_work_hours"("date");

-- CreateIndex
CREATE INDEX "employee_work_hours_department_id_idx" ON "employee_work_hours"("department_id");

-- CreateIndex
CREATE INDEX "waste_records_department_id_idx" ON "waste_records"("department_id");

-- CreateIndex
CREATE INDEX "waste_records_date_idx" ON "waste_records"("date");

-- CreateIndex
CREATE INDEX "paint_records_department_id_idx" ON "paint_records"("department_id");

-- CreateIndex
CREATE INDEX "paint_records_date_idx" ON "paint_records"("date");

-- AddForeignKey
ALTER TABLE "employee_work_hours" ADD CONSTRAINT "employee_work_hours_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_work_hours" ADD CONSTRAINT "employee_work_hours_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_work_hours" ADD CONSTRAINT "employee_work_hours_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_records" ADD CONSTRAINT "waste_records_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paint_records" ADD CONSTRAINT "paint_records_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paint_records" ADD CONSTRAINT "paint_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
