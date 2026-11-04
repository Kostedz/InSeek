package com.lacouf.rsbjwt.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceGray;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.List;
import com.itextpdf.layout.element.ListItem;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.AreaBreakType;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.Year;
import java.time.temporal.ChronoUnit;

/**
 * Builds the three-page French internship agreement PDF.
 */
@Component
public class ContratStageGenerator {

    private static final float TABLE_WIDTH = 430f;
    private static final Color HEADER_GRAY = new DeviceGray(0.88f);

    /**
     * Values printed in the agreement. Missing values are displayed as empty text.
     */
    public static class ContratData {
        public String anneeContrat = Integer.toString(Year.now().getValue());
        public String referenceContrat = "0";
        public String nomGestionnaire = "nom du gestionnaire";
        public String nomEmployeur = "nom de l'employeur";
        public String nomEtudiant = "nom de l'étudiant(e)";
        public String offreLieuStage = "Adresse";
        public String dateDebut = "xx";
        public String dateFin = "xx";
        public String nombreSemaines = "0";
        public String schedule = "Lundi au Jeudi, 7h30 par jour";
        public String heuresSemaine = "0h";
        public String tauxHoraire = "0$/h";
        public String offreDescription = "Description de l'offre de stage.";
        public String signatureEtudiant = "Signature de l'étudiant(e)";
        public String signatureEmployeur = "Signature de l'employeur";
        public String signatureGestionnaire = "Signature du gestionnaire";
        public String dateSignatureEtudiant = "";
        public String dateSignatureEmployeur = "";
        public String dateSignatureGestionnaire = "";
    }

    public byte[] generate(ContratData data) throws IOException {
        ContratData d = data == null ? new ContratData() : data;
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        try (PdfDocument pdf = new PdfDocument(new PdfWriter(output));
             Document doc = new Document(pdf, PageSize.LETTER)) {
            doc.setFont(regular).setFontSize(10);
            doc.setMargins(54, 72, 54, 72);

            addPage1(doc, d, bold);
            doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            addPage2(doc, d, regular, bold);
            doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            addPage3(doc, d, regular, bold);
        }
        return output.toByteArray();
    }

    private void addPage1(Document doc, ContratData d, PdfFont bold) {
        float pageWidth = PageSize.LETTER.getWidth();
        doc.add(new Paragraph("CONTRAT DE STAGE")
                .setFont(bold).setFontSize(18)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(0, 385, pageWidth));
        doc.add(new Paragraph(value(d.anneeContrat) + "-ATE-" + value(d.referenceContrat))
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(0, 80, pageWidth));
    }

    private void addPage2(Document doc, ContratData d, PdfFont regular, PdfFont bold) {
        doc.add(centered("ENTENTE DE STAGE INTERVENUE ENTRE LES PARTIES SUIVANTES", true, 11, regular, bold)
                .setMarginBottom(28));
        doc.add(centered("Dans le cadre de la formule ATE, les parties citées ci-dessous :", false, 11, regular, bold)
                .setMarginBottom(4));
        doc.add(centered("Le gestionnaire de stage, " + value(d.nomGestionnaire), false, 11, regular, bold)
                .setMarginBottom(24));
        doc.add(centered("et", true, 11, regular, bold).setMarginBottom(24));
        doc.add(centered("L’employeur, " + value(d.nomEmployeur), false, 11, regular, bold).setMarginBottom(24));
        doc.add(centered("et", true, 11, regular, bold).setMarginBottom(24));
        doc.add(centered("L’étudiant(e), " + value(d.nomEtudiant), false, 11, regular, bold).setMarginBottom(24));
        doc.add(centered("Conviennent des conditions de stage suivantes :", false, 11, regular, bold)
                .setMarginBottom(6));

        Table table = new Table(UnitValue.createPointArray(new float[]{TABLE_WIDTH}))
                .setHorizontalAlignment(HorizontalAlignment.CENTER)
                .setBorder(new SolidBorder(ColorConstants.BLACK, 0.75f));
        table.addCell(sectionHeader("ENDROIT DU STAGE", bold));
        table.addCell(sectionBody(new Paragraph("Adresse : " + value(d.offreLieuStage)), regular));
        table.addCell(sectionHeader("DURÉE DU STAGE", bold));
        table.addCell(sectionBody(new Paragraph("Date de début : " + value(d.dateDebut) + "\n"
                + "Date de fin : " + value(d.dateFin) + "\n"
                + "Nombre total de semaines : " + value(d.nombreSemaines)), regular));
        table.addCell(sectionHeader("HORAIRE DE TRAVAIL", bold));
        String horaireAffiche = (d.schedule != null && !d.schedule.isBlank()) ? d.schedule : "Lundi au vendredi, 7h30 par jour";
        table.addCell(sectionBody(new Paragraph("Horaire de travail : " + value(horaireAffiche) + "\n"
                + "Nombre total d’heures par semaine : " + value(d.heuresSemaine)), regular));
        table.addCell(sectionHeader("SALAIRE", bold));
        table.addCell(sectionBody(new Paragraph("Salaire horaire : " + value(d.tauxHoraire)), regular));
        doc.add(table);
    }

    private void addPage3(Document doc, ContratData d, PdfFont regular, PdfFont bold) {
        doc.add(new Paragraph("TÂCHES ET RESPONSABILITÉS DU STAGIAIRE")
                .setFont(bold).setFontSize(11).setMarginBottom(2));

        Table descriptionBox = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        descriptionBox.addCell(new Cell()
                .add(new Paragraph(value(d.offreDescription)).setFont(regular).setFontSize(10))
                .setMinHeight(90)
                .setBorder(new SolidBorder(ColorConstants.BLACK, 0.75f))
                .setPadding(5));
        doc.add(descriptionBox);

        doc.add(centered("RESPONSABILITÉS", true, 11, regular, bold).setMarginTop(4).setMarginBottom(4));
        doc.add(subHeading("Le Collège s’engage à :", bold));
        doc.add(bullets(regular,
                "assurer le suivi du stage avec l’étudiant et l’employeur;",
                "offrir du soutien en cas de difficulté liée au stage;",
                "communiquer avec l’employeur pour vérifier le bon déroulement du stage."));
        doc.add(subHeading("L’entreprise s’engage à :", bold));
        doc.add(bullets(regular,
                "accueillir l’étudiant et lui expliquer ses tâches, les règles de travail et les consignes de santé et de sécurité;",
                "lui confier des tâches liées à son stage et lui fournir l’encadrement nécessaire;",
                "informer le Collège de toute difficulté importante concernant le stage."));
        doc.add(subHeading("L’étudiant s’engage à :", bold));
        doc.add(bullets(regular,
                "respecter l’horaire, les règles et les consignes de l’entreprise;",
                "accomplir les tâches confiées avec sérieux et respect;",
                "préserver la confidentialité des renseignements obtenus pendant le stage;"));

        Table band = new Table(UnitValue.createPercentArray(new float[]{1}))
                .useAllAvailableWidth().setMarginTop(6);
        band.addCell(new Cell()
                .add(new Paragraph("SIGNATURES").setFont(bold).setFontSize(11))
                .setBackgroundColor(HEADER_GRAY)
                .setBorder(Border.NO_BORDER)
                .setBorderTop(new SolidBorder(ColorConstants.BLACK, 0.75f))
                .setPadding(6));
        doc.add(band);
        doc.add(new Paragraph("Les parties s’engagent à respecter cette entente de stage")
                .setFont(bold).setFontSize(13).setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(8).setMarginBottom(8));
        doc.add(new Paragraph("En foi de quoi les parties ont signé,")
                .setFont(bold).setFontSize(11).setMarginBottom(4));

        signatureBlock(doc, "L’étudiant(e) :", d.signatureEtudiant, d.nomEtudiant,
                d.dateSignatureEtudiant, regular, bold);
        signatureBlock(doc, "L’employeur :", d.signatureEmployeur, d.nomEmployeur,
                d.dateSignatureEmployeur, regular, bold);
        signatureBlock(doc, "Le gestionnaire de stage :", d.signatureGestionnaire, d.nomGestionnaire,
                d.dateSignatureGestionnaire, regular, bold);
    }

    private Paragraph centered(String text, boolean isBold, float size, PdfFont regular, PdfFont bold) {
        return new Paragraph(text).setFont(isBold ? bold : regular).setFontSize(size)
                .setTextAlignment(TextAlignment.CENTER);
    }

    private Cell sectionHeader(String text, PdfFont bold) {
        return new Cell().add(new Paragraph(text).setFont(bold).setFontSize(11))
                .setBackgroundColor(HEADER_GRAY).setBorder(Border.NO_BORDER)
                .setBorderTop(new SolidBorder(ColorConstants.BLACK, 0.75f))
                .setPaddingLeft(8).setPaddingTop(3).setPaddingBottom(3);
    }

    private Cell sectionBody(Paragraph paragraph, PdfFont regular) {
        return new Cell().add(paragraph.setFont(regular).setFontSize(11).setMultipliedLeading(1.0f))
                .setBorder(Border.NO_BORDER).setPaddingLeft(8).setPaddingTop(3).setPaddingBottom(3);
    }

    private Paragraph subHeading(String text, PdfFont bold) {
        return new Paragraph(text).setFont(bold).setFontSize(11).setMarginTop(3).setMarginBottom(1);
    }

    private List bullets(PdfFont regular, String... items) {
        List list = new List().setListSymbol("• ").setFont(regular).setFontSize(8.5f)
                .setMarginLeft(10).setSymbolIndent(8);
        for (String item : items) {
            ListItem listItem = new ListItem(item);
            listItem.setMarginBottom(2);
            list.add(listItem);
        }
        return list;
    }

    private void signatureBlock(Document doc, String label, String signatureText, String name, String signedAt,
                                PdfFont regular, PdfFont bold) {
        doc.add(new Paragraph(label).setFont(bold).setFontSize(11).setMarginTop(5).setMarginBottom(8));
        doc.add(new Paragraph(value(signatureText)).setFont(regular).setFontSize(10).setMarginBottom(2));
        Table table = new Table(UnitValue.createPercentArray(new float[]{45, 55})).useAllAvailableWidth();
        table.addCell(new Cell().add(new Paragraph(value(name)).setFont(regular).setFontSize(10))
                .setBorder(Border.NO_BORDER).setBorderTop(new SolidBorder(ColorConstants.BLACK, 0.75f))
                .setPaddingLeft(0));
        table.addCell(new Cell().add(new Paragraph(signedAt == null || signedAt.isBlank()
                        ? "Date : __________________" : "Date : " + signedAt)
                        .setFont(regular).setFontSize(10))
                .setBorder(Border.NO_BORDER).setBorderTop(new SolidBorder(ColorConstants.BLACK, 0.75f)));
        doc.add(table);
    }

    public static String weeksBetween(LocalDate start, LocalDate end) {
        if (start == null || end == null || end.isBefore(start)) {
            return "0";
        }
        long days = ChronoUnit.DAYS.between(start, end);
        return Long.toString((days + 6) / 7);
    }

    private static String value(String value) {
        return value == null ? "" : value;
    }
}
