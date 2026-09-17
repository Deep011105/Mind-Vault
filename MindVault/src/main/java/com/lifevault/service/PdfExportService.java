package com.lifevault.service;

import com.lifevault.entity.JournalEntry;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy");

    public byte[] exportEntries(List<JournalEntry> entries, String title) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.DARK_GRAY);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            document.add(new Paragraph(title, titleFont));
            document.add(Chunk.NEWLINE);

            for (JournalEntry entry : entries) {
                String dateLine = entry.getCreatedAt().atZone(ZoneId.systemDefault()).format(DATE_FMT)
                        + "  ·  Mood: " + entry.getMood();
                document.add(new Paragraph(dateLine, metaFont));
                document.add(new Paragraph(entry.getContent(), bodyFont));
                document.add(Chunk.NEWLINE);
                document.add(new Paragraph("________________________________________", metaFont));
                document.add(Chunk.NEWLINE);
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate PDF export", e);
        }
    }
}
