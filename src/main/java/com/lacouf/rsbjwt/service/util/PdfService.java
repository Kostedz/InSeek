package com.lacouf.rsbjwt.service.util;

import com.itextpdf.forms.PdfAcroForm;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@Service
public class PdfService {
    public byte[] createInvoice(String customerName, String invoiceNumber)
            throws Exception {

        ByteArrayOutputStream output = new ByteArrayOutputStream();

        //TODO: add the actual template and experiment with the fields to fill in the PDF

        /*
        Field names:
            reference_contrat
            nom_gestionnaire
            nom_employeur
            nom_etudiant
            stage_lieu
            date_debut
            date_fin
            nombre_semaines
            heures_semaine
            salaire
            offre_description
            signature_etudiant
            signature_employeur
            signature_gestionnaire
            date_signature_etudiant
            date_signature_employeur
            date_signature_gestionnaire
         */
        try (InputStream template =
                     new ClassPathResource("templates/invoice-template.pdf").getInputStream();
             PdfDocument pdf = new PdfDocument(
                     new PdfReader(template),
                     new PdfWriter(output))) {

            PdfAcroForm form = PdfAcroForm.getAcroForm(pdf, true);
            form.getField("customerName").setValue(customerName);
            form.getField("invoiceNumber").setValue(invoiceNumber);

            // Optional: make the filled fields non-editable in the output.
            form.flattenFields();
        }

        return output.toByteArray();
    }
}
