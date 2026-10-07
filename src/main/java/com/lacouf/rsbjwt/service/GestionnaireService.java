    package com.lacouf.rsbjwt.service;

    import com.lacouf.rsbjwt.exception.BadRequestException;
    import com.lacouf.rsbjwt.exception.NotFoundException;
    import com.lacouf.rsbjwt.model.Document;
    import com.lacouf.rsbjwt.model.StatutValidation;
    import com.lacouf.rsbjwt.repository.DocumentRepository;
    import com.lacouf.rsbjwt.service.dto.DocumentValidationDTO;
    import lombok.RequiredArgsConstructor;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    import java.util.List;

    @Service
    @RequiredArgsConstructor
    public class GestionnaireService {
        private final DocumentRepository documentRepository;

        @Transactional(readOnly = true)
        public List<DocumentValidationDTO> listPendingDocuments(String type) {
            return switch (type) {
                case "CV" -> documentRepository.findCVByStatut(StatutValidation.EN_ATTENTE)
                        .stream()
                        .map(DocumentValidationDTO::of)
                        .toList();
                case "OffreDeStage" -> documentRepository.findOffreDeStageByStatut(StatutValidation.EN_ATTENTE)
                        .stream()
                        .map(DocumentValidationDTO::of)
                        .toList();
                default ->
                        throw new IllegalArgumentException("Type de document invalide. Les types valides sont 'CV' et 'OffreDeStage'.");
            };

        }

        @Transactional
        public DocumentValidationDTO approveDocument(Long documentId) throws NotFoundException , BadRequestException {
            Document document = getPendingDocumentById(documentId);

            document.setStatut(StatutValidation.VALIDE);

            documentRepository.save(document);

            return DocumentValidationDTO.of(document);
        }

        @Transactional
        public DocumentValidationDTO rejectDocument(Long documentId, String comment) throws NotFoundException , BadRequestException{

            if(comment == null || comment.isBlank()) {
                throw new BadRequestException("Un commentaire est requis pour rejeter un document.");
            }
            Document document = getPendingDocumentById(documentId);

            document.setStatut(StatutValidation.REJETE);
            document.setCommentaireRejet(comment);
            documentRepository.save(document);

            return DocumentValidationDTO.of(document);
        }

        private Document getPendingDocumentById(Long documentId) throws NotFoundException, BadRequestException {
            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new NotFoundException("Document non trouvé"));

            if (document.getStatut() != StatutValidation.EN_ATTENTE) {
                throw new BadRequestException("Ce document a deja été traité et ne peut pas être approuvé ou rejeté.");
            }
            return document;
        }

    }
