from typing import Optional, List, Union, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from enum import Enum


class Sex(str, Enum):
    """Sex enumeration as per SENDIG standards"""
    MALE = "M"
    FEMALE = "F"
    UNKNOWN = "U"


class StudyPhase(str, Enum):
    """Study phase enumeration"""
    SCREENING = "SCREENING"
    TREATMENT = "TREATMENT"
    RECOVERY = "RECOVERY"
    TERMINAL = "TERMINAL"


class BaseSDTMRecord(BaseModel):
    """Base class for all SDTM records"""
    studyid: str = Field(..., description="Study Identifier")
    domain: str = Field(..., description="Domain Abbreviation")
    usubjid: str = Field(..., description="Unique Subject Identifier")
    
    class Config:
        use_enum_values = True
        validate_assignment = True


class DemographicRecord(BaseSDTMRecord):
    """Demographic Domain (DM) - SENDIG compliant"""
    domain: str = Field(default="DM", const=True)
    dmseq: int = Field(..., description="Sequence Number")
    
    # Core demographic variables
    species: Optional[str] = Field(None, description="Species")
    strain: Optional[str] = Field(None, description="Strain/Substrain")
    sex: Optional[Sex] = Field(None, description="Sex")
    
    # Age and timing
    age: Optional[float] = Field(None, description="Age")
    ageu: Optional[str] = Field(None, description="Age Units")
    agetxt: Optional[str] = Field(None, description="Age as Collected")
    
    # Study dates
    rfstdtc: Optional[str] = Field(None, description="Subject Reference Start Date/Time")
    rfendtc: Optional[str] = Field(None, description="Subject Reference End Date/Time")
    
    # Dosing information
    arm: Optional[str] = Field(None, description="Planned Arm Code")
    armcd: Optional[str] = Field(None, description="Planned Arm Code")
    
    # Additional fields
    dmdtc: Optional[str] = Field(None, description="Date/Time of Collection")
    dmdy: Optional[int] = Field(None, description="Study Day of Collection")


class ClinicalObservationRecord(BaseSDTMRecord):
    """Clinical Observations Domain (CL) - SENDIG compliant"""
    domain: str = Field(default="CL", const=True)
    clseq: int = Field(..., description="Sequence Number")
    
    # Test information
    cltestcd: str = Field(..., description="Clinical Observation Test Short Name")
    cltest: str = Field(..., description="Clinical Observation Test Name")
    clcat: Optional[str] = Field(None, description="Category for Clinical Observation")
    clscat: Optional[str] = Field(None, description="Subcategory for Clinical Observation")
    
    # Results
    clgrpid: Optional[str] = Field(None, description="Group ID")
    clrefid: Optional[str] = Field(None, description="Reference ID")
    clspid: Optional[str] = Field(None, description="Sponsor-Defined Identifier")
    
    # Observation details
    clorres: Optional[str] = Field(None, description="Result or Finding in Original Units")
    clorresu: Optional[str] = Field(None, description="Original Units")
    clstresc: Optional[str] = Field(None, description="Character Result/Finding in Std Format")
    clstresn: Optional[float] = Field(None, description="Numeric Result/Finding in Standard Units")
    clstresu: Optional[str] = Field(None, description="Standard Units")
    
    # Reference ranges
    clstnrlo: Optional[float] = Field(None, description="Reference Range Lower Limit-Std Units")
    clstnrhi: Optional[float] = Field(None, description="Reference Range Upper Limit-Std Units")
    clnrind: Optional[str] = Field(None, description="Reference Range Indicator")
    
    # Timing
    cldtc: Optional[str] = Field(None, description="Date/Time of Collection")
    cldy: Optional[int] = Field(None, description="Study Day of Collection")
    cltpt: Optional[str] = Field(None, description="Planned Time Point Name")
    cltptnum: Optional[float] = Field(None, description="Planned Time Point Number")
    cleltm: Optional[str] = Field(None, description="Planned Elapsed Time from Time Point Ref")
    
    # Method and position
    clmethod: Optional[str] = Field(None, description="Method of Test or Examination")
    clloc: Optional[str] = Field(None, description="Location of Observation")
    clpos: Optional[str] = Field(None, description="Position of Subject")


class FoodConsumptionRecord(BaseSDTMRecord):
    """Food Consumption Domain (FC) - SENDIG compliant"""
    domain: str = Field(default="FC", const=True)
    fcseq: int = Field(..., description="Sequence Number")
    
    # Test information
    fctestcd: str = Field(..., description="Food Consumption Test Short Name")
    fctest: str = Field(..., description="Food Consumption Test Name")
    fccat: Optional[str] = Field(None, description="Category for Food Consumption")
    fcscat: Optional[str] = Field(None, description="Subcategory for Food Consumption")
    
    # Results
    fcorres: Optional[str] = Field(None, description="Result or Finding in Original Units")
    fcorresu: Optional[str] = Field(None, description="Original Units")
    fcstresc: Optional[str] = Field(None, description="Character Result/Finding in Std Format")
    fcstresn: Optional[float] = Field(None, description="Numeric Result/Finding in Standard Units")
    fcstresu: Optional[str] = Field(None, description="Standard Units")
    
    # Statistical results
    fcstat: Optional[str] = Field(None, description="Completion Status")
    fcreasnd: Optional[str] = Field(None, description="Reason Test Not Done")
    
    # Timing
    fcstdtc: Optional[str] = Field(None, description="Start Date/Time of Collection")
    fcendtc: Optional[str] = Field(None, description="End Date/Time of Collection")
    fcdy: Optional[int] = Field(None, description="Study Day of Collection")
    
    # Method
    fcmethod: Optional[str] = Field(None, description="Method of Test")


class BodyWeightRecord(BaseSDTMRecord):
    """Body Weight Domain (BW) - SENDIG compliant"""
    domain: str = Field(default="BW", const=True)
    bwseq: int = Field(..., description="Sequence Number")
    
    # Test information
    bwtestcd: str = Field(default="BW", description="Body Weight Test Short Name")
    bwtest: str = Field(default="Body Weight", description="Body Weight Test Name")
    
    # Results
    bworres: Optional[str] = Field(None, description="Result or Finding in Original Units")
    bworresu: Optional[str] = Field(None, description="Original Units")
    bwstresc: Optional[str] = Field(None, description="Character Result/Finding in Std Format")
    bwstresn: Optional[float] = Field(None, description="Numeric Result/Finding in Standard Units")
    bwstresu: Optional[str] = Field(None, description="Standard Units")
    
    # Statistical results
    bwstat: Optional[str] = Field(None, description="Completion Status")
    bwreasnd: Optional[str] = Field(None, description="Reason Test Not Done")
    
    # Timing
    bwdtc: Optional[str] = Field(None, description="Date/Time of Collection")
    bwdy: Optional[int] = Field(None, description="Study Day of Collection")


class MacroscopicFindingsRecord(BaseSDTMRecord):
    """Macroscopic Findings Domain (MA) - SENDIG compliant"""
    domain: str = Field(default="MA", const=True)
    maseq: int = Field(..., description="Sequence Number")
    
    # Test information
    macat: Optional[str] = Field(None, description="Category for Macroscopic Findings")
    mascat: Optional[str] = Field(None, description="Subcategory for Macroscopic Findings")
    
    # Findings
    maorres: Optional[str] = Field(None, description="Result or Finding in Original Units")
    mastresc: Optional[str] = Field(None, description="Character Result/Finding in Std Format")
    
    # Location
    maloc: Optional[str] = Field(None, description="Location of Finding")
    malat: Optional[str] = Field(None, description="Laterality")
    madir: Optional[str] = Field(None, description="Directionality")
    maportot: Optional[str] = Field(None, description="Portion or Totality")
    
    # Method
    mamethod: Optional[str] = Field(None, description="Method of Examination")
    
    # Timing
    madtc: Optional[str] = Field(None, description="Date/Time of Collection")
    mady: Optional[int] = Field(None, description="Study Day of Collection")


class MicroscopicFindingsRecord(BaseSDTMRecord):
    """Microscopic Findings Domain (MI) - SENDIG compliant"""
    domain: str = Field(default="MI", const=True)
    miseq: int = Field(..., description="Sequence Number")
    
    # Test information
    micat: Optional[str] = Field(None, description="Category for Microscopic Findings")
    miscat: Optional[str] = Field(None, description="Subcategory for Microscopic Findings")
    
    # Findings
    miorres: Optional[str] = Field(None, description="Result or Finding in Original Units")
    mistresc: Optional[str] = Field(None, description="Character Result/Finding in Std Format")
    
    # Severity/Grade
    misev: Optional[str] = Field(None, description="Severity/Intensity")
    mirescat: Optional[str] = Field(None, description="Result Category")
    
    # Location
    miloc: Optional[str] = Field(None, description="Location of Finding")
    milat: Optional[str] = Field(None, description="Laterality")
    midir: Optional[str] = Field(None, description="Directionality")
    miportot: Optional[str] = Field(None, description="Portion or Totality")
    
    # Method
    mimethod: Optional[str] = Field(None, description="Method of Examination")
    
    # Timing
    midtc: Optional[str] = Field(None, description="Date/Time of Collection")
    midy: Optional[int] = Field(None, description="Study Day of Collection")


class OrganMeasurementsRecord(BaseSDTMRecord):
    """Organ Measurements Domain (OM) - SENDIG compliant"""
    domain: str = Field(default="OM", const=True)
    omseq: int = Field(..., description="Sequence Number")
    
    # Test information
    omtestcd: str = Field(..., description="Organ Measurement Test Short Name")
    omtest: str = Field(..., description="Organ Measurement Test Name")
    omcat: Optional[str] = Field(None, description="Category for Organ Measurements")
    omscat: Optional[str] = Field(None, description="Subcategory for Organ Measurements")
    
    # Results
    omorres: Optional[str] = Field(None, description="Result or Finding in Original Units")
    omorresu: Optional[str] = Field(None, description="Original Units")
    omstresc: Optional[str] = Field(None, description="Character Result/Finding in Std Format")
    omstresn: Optional[float] = Field(None, description="Numeric Result/Finding in Standard Units")
    omstresu: Optional[str] = Field(None, description="Standard Units")
    
    # Location
    omloc: Optional[str] = Field(None, description="Location of Organ")
    omlat: Optional[str] = Field(None, description="Laterality")
    omdir: Optional[str] = Field(None, description="Directionality")
    omportot: Optional[str] = Field(None, description="Portion or Totality")
    
    # Method
    ommethod: Optional[str] = Field(None, description="Method of Measurement")
    
    # Timing
    omdtc: Optional[str] = Field(None, description="Date/Time of Collection")
    omdy: Optional[int] = Field(None, description="Study Day of Collection")


class PDFExtractionMetadata(BaseModel):
    """Metadata for PDF extraction process"""
    filename: str = Field(..., description="Original PDF filename")
    file_hash: str = Field(..., description="MD5 hash of the file")
    extraction_timestamp: datetime = Field(default_factory=datetime.now)
    total_pages: int = Field(..., description="Total number of pages")
    extracted_pages: List[int] = Field(default_factory=list, description="Pages where data was extracted")
    domains_detected: List[str] = Field(default_factory=list, description="SENDIG domains detected")
    confidence_scores: Dict[str, float] = Field(default_factory=dict, description="Confidence scores per domain")
    processing_time_seconds: Optional[float] = Field(None, description="Time taken for extraction")
    ai_model_used: Optional[str] = Field(None, description="AI model used for extraction")
    extraction_errors: List[str] = Field(default_factory=list, description="Any errors during extraction")


class ExtractedData(BaseModel):
    """Container for all extracted data from a PDF"""
    metadata: PDFExtractionMetadata
    demographics: List[DemographicRecord] = Field(default_factory=list)
    clinical_observations: List[ClinicalObservationRecord] = Field(default_factory=list)
    food_consumption: List[FoodConsumptionRecord] = Field(default_factory=list)
    body_weights: List[BodyWeightRecord] = Field(default_factory=list)
    macroscopic_findings: List[MacroscopicFindingsRecord] = Field(default_factory=list)
    microscopic_findings: List[MicroscopicFindingsRecord] = Field(default_factory=list)
    organ_measurements: List[OrganMeasurementsRecord] = Field(default_factory=list)
    
    def get_domain_data(self, domain: str) -> List[BaseSDTMRecord]:
        """Get data for a specific domain"""
        domain_mapping = {
            'DM': self.demographics,
            'CL': self.clinical_observations,
            'FC': self.food_consumption,
            'BW': self.body_weights,
            'MA': self.macroscopic_findings,
            'MI': self.microscopic_findings,
            'OM': self.organ_measurements,
        }
        return domain_mapping.get(domain.upper(), [])
    
    def get_all_records(self) -> List[BaseSDTMRecord]:
        """Get all records combined"""
        all_records = []
        all_records.extend(self.demographics)
        all_records.extend(self.clinical_observations)
        all_records.extend(self.food_consumption)
        all_records.extend(self.body_weights)
        all_records.extend(self.macroscopic_findings)
        all_records.extend(self.microscopic_findings)
        all_records.extend(self.organ_measurements)
        return all_records
    
    def validate_sendig_compliance(self) -> Dict[str, List[str]]:
        """Validate SENDIG 3.1 compliance"""
        validation_errors = {}
        
        # Check required fields for each domain
        for domain, records in [
            ('DM', self.demographics),
            ('CL', self.clinical_observations),
            ('FC', self.food_consumption),
            ('BW', self.body_weights),
            ('MA', self.macroscopic_findings),
            ('MI', self.microscopic_findings),
            ('OM', self.organ_measurements),
        ]:
            domain_errors = []
            for i, record in enumerate(records):
                # Check required fields
                if not record.studyid:
                    domain_errors.append(f"Record {i+1}: Missing required STUDYID")
                if not record.usubjid:
                    domain_errors.append(f"Record {i+1}: Missing required USUBJID")
                if not record.domain:
                    domain_errors.append(f"Record {i+1}: Missing required DOMAIN")
                    
            if domain_errors:
                validation_errors[domain] = domain_errors
                
        return validation_errors


# Export all schema classes for easy importing
__all__ = [
    'Sex',
    'StudyPhase',
    'BaseSDTMRecord',
    'DemographicRecord',
    'ClinicalObservationRecord',
    'FoodConsumptionRecord',
    'BodyWeightRecord',
    'MacroscopicFindingsRecord',
    'MicroscopicFindingsRecord',
    'OrganMeasurementsRecord',
    'PDFExtractionMetadata',
    'ExtractedData',
]
