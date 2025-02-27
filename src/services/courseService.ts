// src/services/courseService.ts
import {PrismaClient, Prisma} from '@prisma/client';
import dayjs from "dayjs";
import weekday from 'dayjs/plugin/weekday'
import localeData from 'dayjs/plugin/localeData'
import 'dayjs/locale/es'

dayjs.extend(localeData)
dayjs.extend(weekday)
dayjs.locale('es')

const prisma = new PrismaClient();

export interface Course {
    idopencourse?: string;
    code?: string;
    name: string;
    start_date: string;
    end_date: string;
    participants_number: number;
    availability: number;
}

export function convertLatinToUtf8(value: string): string {
    const valueTrim = value.trim()
    try {
        return Buffer.from(valueTrim, 'latin1').toString('utf8')
    } catch (error) {
        console.error('Error al decodificar:', error)
        return valueTrim
    }
}


export async function getCourses(date: string) {
    const query = Prisma.sql`
        SELECT CAST(opencourse.idopencourse AS CHAR) AS idopencourse,
               course.code,
               course.name,
               opencourse.datestart          AS start_date,
               opencourse.dateend            AS end_date,
               opencourse.participantsnumber AS participants_number,
               CAST(
                (opencourse.participantsnumber - (
                       opencourse.currentreserved +
                       opencourse.currentenrollment +
                       opencourse.currentpayment +
                       opencourse.currentoc)) AS CHAR) AS availability
        FROM vwi.course
        INNER JOIN vwi.opencourse USING (idcourse)
        WHERE vwi.course.trash = 0 AND datestart >= ${Prisma.sql`${date}`}`;

    const results = await prisma.$queryRaw<Course[]>(query);

    // Transform the results
    return (results || []).map((course: Course) => ({
        name: course.code + ' ' + convertLatinToUtf8(course.name),
        start_date: dayjs(course.start_date).format('DD [de] MMMM [de] YYYY'),
        end_date: dayjs(course.end_date).format('DD [de] MMMM [de] YYYY'),
        participants_number: course.participants_number,
        availability: Number(course.availability),
    }));
}