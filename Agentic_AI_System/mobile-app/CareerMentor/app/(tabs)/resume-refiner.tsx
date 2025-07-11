import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Platform, TextInput, KeyboardAvoidingView, Alert, Image } from 'react-native';
import { Text } from '@/components/Themed';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { API_BASE_URL, API_FALLBACK_URLS } from '@/constants/ApiEndpoints';
import { ResumeService } from '@/services/ResumeService';
import { loadJobs } from '@/utils/dataLoader';
import { truncateText, formatPercentage } from '@/utils/formatters';
import GradientButton from '@/components/trackpal/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { mockGlobalStateService } from '@/services/MockGlobalStateService';
import { useRouter } from 'expo-router';

// Import resume-refiner components
import UploadOptionsModal from '@/components/resume-refiner/UploadOptionsModal';
import ResumeAnalysisResults from '@/components/resume-refiner/ResumeAnalysisResults';
import FileUploadStatus from '@/components/resume-refiner/FileUploadStatus';
import CircularProgress from '@/components/resume-refiner/CircularProgress';
import TrackpalStyleJobCard from '@/components/resume-refiner/TrackpalStyleJobCard';
import HeaderWithToggle from '@/components/common/HeaderWithToggle';

// Import services
import { FileUploadService } from '@/services/FileUploadService';

// Define the Job interface
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  match?: number;
}

// Define styles outside of the component function
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.nightSky,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  logo: {
    width: 30,
    height: 36, 
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 0, 
    marginTop: 0, 
    marginLeft: 0,
    textAlign: 'left',
    alignSelf: 'center', 
  },
  content: {
    flex: 1,
    padding: 12,
    paddingTop: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 87,
    borderRadius: 25,
    backgroundColor: COLORS.salt,
    padding: 3,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 0,
  },
  activeTab: {
    backgroundColor: COLORS.nightSky,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.nightSky,
  },
  activeTabText: {
    color: COLORS.white,
  },
  uploadButton: {
    backgroundColor: COLORS.nightSky,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadDescription: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.midnight,
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: COLORS.nightSky,
  },
  loadingTextBelow: {
    marginTop: 20,
  },
  jobList: {
    marginTop: 8,
  },
  matchButton: {
    backgroundColor: COLORS.nightSky,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  matchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.salt,
    borderRadius: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.nightSky,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.nightSky,
    marginVertical: 10,
  },
  progressBar: { 
    height: 10, 
    backgroundColor: COLORS.nightSky, 
    borderRadius: 5 
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: COLORS.nightSky,
    borderRadius: 5,
  },
  chatContainer: { 
    flex: 1 
  },
  messageBubble: { 
    backgroundColor: COLORS.salt, 
    padding: 10, 
    borderRadius: 5, 
    marginVertical: 5 
  },
  messageText: { 
    fontSize: 16, 
    color: COLORS.midnight 
  },
  sectionHeader: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginTop: 10, 
    marginBottom: 5, 
    color: COLORS.nightSky 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: COLORS.nightSky,
  },
  card: { 
    backgroundColor: COLORS.lightRose, 
    padding: 12, 
    borderRadius: 10, 
    marginVertical: 8, 
    elevation: 2, 
    shadowColor: COLORS.midnight, 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 1.5 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '500' 
  },
  cardSubtitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginTop: 16, 
    color: COLORS.nightSky 
  },
  cardDescription: { 
    fontSize: 14, 
    marginTop: 4, 
    marginBottom: 8, 
    color: COLORS.sky, 
    fontStyle: 'italic' 
  },
  cardText: { 
    fontSize: 14, 
    marginVertical: 2, 
    paddingLeft: 4 
  },
  overallScoreContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  overallScoreText: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  overallScoreLabel: { 
    fontSize: 16, 
    marginLeft: 5 
  },
  categorySectionHeader: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginTop: 8, 
    marginBottom: 5, 
    color: COLORS.nightSky 
  },
  categoryRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 5 
  },
  categoryLabel: { 
    fontSize: 16, 
    flex: 1 
  },
  scoreBarContainer: { 
    height: 10, 
    width: '60%', 
    backgroundColor: '#ddd', 
    borderRadius: 5, 
    marginRight: 10 
  },
  scoreBar: { 
    height: 10, 
    borderRadius: 5 
  },
  scoreBarLow: { 
    backgroundColor: COLORS.rose 
  },
  scoreBarMedium: { 
    backgroundColor: COLORS.sky 
  },
  scoreBarHigh: { 
    backgroundColor: COLORS.nightSky 
  },
  scoreValue: { 
    fontSize: 16 
  },
  fileNameContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 5, 
    backgroundColor: COLORS.salt, 
    padding: 8, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: COLORS.lightRose, 
    justifyContent: 'space-between' 
  },
  fileName: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: COLORS.nightSky, 
    marginLeft: 5, 
    flex: 1 
  },
  uploadIconContainer: { 
    backgroundColor: COLORS.lightRose, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8 
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.nightSky,
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    width: '100%',
    marginBottom: 16,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: COLORS.nightSky,
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 12,
  },
  modalCloseButtonText: {
    color: COLORS.rose,
    fontSize: 16,
  },
  analysisContainer: {
    flex: 1,
  },
  scoreSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: COLORS.salt,
    borderRadius: 10,
  },
  scoreTextContainer: {
    marginLeft: 15,
  },
  overallScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.nightSky,
  },
  categoryScoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  feedbackSection: {
    marginBottom: 20,
  },
  categoriesContainer: {
    marginTop: 10,
  },
  categoryItem: {
    marginBottom: 10,
  },
  noContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noContentText: {
    fontSize: 16,
    color: COLORS.midnight,
    textAlign: 'center',
  },

  jobListSection: {
    marginBottom: 20,
  },
  feedbackMessages: {
    marginTop: 10,
  },
  messageBubble: {
    backgroundColor: COLORS.salt,
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.midnight,
  },
  resultContainer: {
    backgroundColor: COLORS.salt,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.nightSky,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.sky,
    marginBottom: 16,
  },
  scoreSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.midnight,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryLabel: {
    backgroundColor: COLORS.lightRose,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 14,
    color: COLORS.midnight,
  },
  suggestionsList: {
    marginTop: 8,
  },
  suggestionItem: {
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.midnight,
  },
  noContentContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noContentText: {
    fontSize: 16,
    color: COLORS.midnight,
    textAlign: 'center',
  },
  currentCVContainer: {
    backgroundColor: COLORS.salt,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.midnight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  currentCVContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentCVTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  currentCVTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.midnight,
  },
  currentCVFilename: {
    fontSize: 12,
    color: COLORS.midnight,
    opacity: 0.7,
    maxWidth: '80%',
  },
  currentCVAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replaceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentCVActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'white',
    marginRight: 4,
  },
  matchInstructionText: {
    fontSize: 14,
    color: COLORS.midnight,
    marginBottom: 12,
    width: '100%',
    textAlign: 'left',
  },
  sectionHeader: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginTop: 10, 
    marginBottom: 5, 
    color: COLORS.nightSky 
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  matchScoreTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  matchScoreLabel: {
    fontSize: 14,
    color: COLORS.midnight,
  },
  matchScoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.nightSky,
  },
  matchScoreJob: {
    fontSize: 14,
    color: COLORS.midnight,
    fontStyle: 'italic',
  },
  jobListScrollView: {
    maxHeight: 800,
    marginBottom: -12,
    backgroundColor: 'transparent',
  },
  jobSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addCustomJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addJobButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  addJobButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  customJobForm: {
    backgroundColor: COLORS.salt,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  customJobInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  customJobTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addCustomJobSubmitButton: {
    backgroundColor: COLORS.sky,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addCustomJobSubmitText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  missingKeywordsContainer: {
    marginTop: 16,
  },
  missingKeywordsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.nightSky,
    marginBottom: 8,
  },
  keywordTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordTag: {
    backgroundColor: COLORS.salt,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  keywordTagText: {
    color: COLORS.nightSky,
    fontSize: 14,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.nightSky,
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  suggestionBullet: {
    fontSize: 16,
    color: COLORS.nightSky,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.midnight,
    flex: 1,
  },
  gradientUploadButton: {
    width: '60%',
    marginBottom: 20,
  },
  floatingMatchButton: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'flex-end',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    zIndex: 1000,
    width: '50%',
    maxWidth: 500,
  },
  matchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  matchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  matchResultModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    width: '100%',
    height: '100%',
  },
  matchResultModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginTop: 100,
    width: '90%',
    maxHeight: '90%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 10,
  },
  noJobsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noJobsText: {
    fontSize: 16,
    color: COLORS.midnight,
    textAlign: 'center',
  },
  findJobsButtonContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findJobsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    maxWidth: '50%',
  },
  findJobsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  findMoreJobsButtonContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Helper function to determine the color based on match percentage
const getMatchColor = (match: number): string => {
  if (match >= 75) return COLORS.green;  // Good match - green
  if (match >= 50) return COLORS.yellow; // Medium match - yellow
  return COLORS.red;                     // Poor match - red
};

export default function ResumeRefinerScreen() {
  console.log(" ResumeRefinerScreen rendered");
  
  const router = useRouter();
  
  // State for job data
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // State for file upload and processing
  const [uploadStarted, setUploadStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<'uploading' | 'parsing' | 'analyzing' | 'feedback' | 'matching'>('uploading');
  const [loadingDots, setLoadingDots] = useState('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [uploadId, setUploadId] = useState<string>('');
  
  // State for upload options modal
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  
  // State for UI tabs and job selection
  const [activeTab, setActiveTab] = useState<'analyse' | 'match'>('analyse');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  
  // State for analysis results
  const [categoryScores, setCategoryScores] = useState<{
    format_layout: number;
    inhalt_struktur: number;
    sprache_stil: number;
    ergebnis_orientierung: number;
    overall: number;
  } | null>(null);
  
  const [feedbackMessages, setFeedbackMessages] = useState<Array<{text: string, section: string}>>([]);
  const [matchResult, setMatchResult] = useState<{
    match_score: number;
    missing_keywords: string[];
    improvement_suggestions: string[];
  } | null>(null);
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // State for custom job input
  const [showCustomJobInput, setShowCustomJobInput] = useState(false);
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customJobCompany, setCustomJobCompany] = useState('');
  const [customJobDescription, setCustomJobDescription] = useState('');
  const [customJobSkills, setCustomJobSkills] = useState('');

  const [showMatchResultModal, setShowMatchResultModal] = useState(false);

  // Ref for loading animation cleanup
  const loadingAnimationCleanupRef = useRef<(() => void) | null>(null);

  // Ref to track if a document picker is already active
  const isDocumentPickerActiveRef = useRef(false);

  // Load job data on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Use ResumeService.getSavedJobs() to fetch jobs from MongoDB
        const loadedJobs = await ResumeService.getSavedJobs();
        // Convert loaded jobs to match our Job interface
        const convertedJobs: Job[] = loadedJobs.map(job => ({
          id: job.id || '',
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          description: job.description || '',
          skills: job.skills || [],
          match: job.match || 0
        }));
        setJobs(convertedJobs);
        console.log(' Jobs loaded successfully:', convertedJobs.length);
      } catch (error) {
        console.error(' Error loading jobs:', error);
      }
    };
    
    fetchJobs();
  }, []);

  // Animation for loading dots (used for resume analysis)
  const startLoadingAnimation = () => {
    // Clear any existing animation
    if (loadingAnimationCleanupRef.current) {
      loadingAnimationCleanupRef.current();
      loadingAnimationCleanupRef.current = null;
    }
    
    // Reset loading progress to 0% when starting a new animation
    setLoadingProgress(0);
    
    const interval = setInterval(() => {
      setLoadingDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    
    // Simulate progress for demo purposes - slower increase
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        // Slower increment (reduced from 5 to 2)
        const newProgress = prev + (Math.random() * 2);
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 500); // Increased interval from 300ms to 500ms
    
    // Store cleanup function in ref
    const cleanup = () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
    
    loadingAnimationCleanupRef.current = cleanup;
    return cleanup;
  };
  
  // Faster animation for job matching
  const startJobMatchingAnimation = () => {
    // Clear any existing animation
    if (loadingAnimationCleanupRef.current) {
      loadingAnimationCleanupRef.current();
      loadingAnimationCleanupRef.current = null;
    }
    
    // Reset loading progress to 0% when starting a new animation
    setLoadingProgress(0);
    
    const interval = setInterval(() => {
      setLoadingDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 450); // Slowed down dot animation even more from 300ms to 450ms
    
    // Simulate progress for demo purposes - much faster increase
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        // Even slower increment for job matching
        const newProgress = prev + (Math.random() * 2 + 1); // Add minimum 1% each time, up to 3%
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 400); // Slowed down progress updates even more from 250ms to 400ms
    
    // Store cleanup function in ref
    const cleanup = () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
    
    loadingAnimationCleanupRef.current = cleanup;
    return cleanup;
  };

  // Function to handle document selection
  const handleDocumentPick = async () => {
    console.log('Document pick handler triggered');
    
    try {
      console.log('Launching document picker...');
      
      // Use the most basic form of DocumentPicker
      const result = await DocumentPicker.getDocumentAsync();
      
      console.log('Document picker result:', result);
      
      // Close modal immediately regardless of result
      setShowUploadOptions(false);
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Document picking was canceled or no file selected');
        return;
      }
      
      const asset = result.assets[0];
      const fileName = asset.name || 'document';
      const uri = asset.uri;
      const mimeType = asset.mimeType || FileUploadService.getMimeType(fileName);
      
      console.log('Selected document:', { fileName, uri });
      
      setCurrentFileName(fileName);
      
      // Start upload process
      setLoading(true);
      setLoadingStage('uploading');
      setUploadStatus('uploading');
      startLoadingAnimation();
      
      try {
        console.log('Starting upload with ResumeService...');
        const response = await ResumeService.uploadResume(uri, fileName, mimeType);
        console.log('Upload successful, response received:', response);
        
        // Extract upload ID from response
        let uploadId = response?.upload_id;
        
        if (!uploadId) {
          console.log('No upload_id found in response, using fallback');
          uploadId = `temp_${Date.now()}`;
        }
        
        console.log('Setting upload ID:', uploadId);
        setUploadId(uploadId);
        setUploadStarted(true);
        setUploadStatus('processing');
        analyzeResume(uploadId);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError('Failed to upload document. Please try again.');
        setUploadStatus('error');
        setLoading(false);
        
        if (loadingAnimationCleanupRef.current) {
          loadingAnimationCleanupRef.current();
          loadingAnimationCleanupRef.current = null;
        }
      } finally {
        setShowUploadOptions(false);
      }
    } catch (pickerError) {
      console.error('Document picker error:', pickerError);
      setUploadError('Error selecting document. Please try again.');
      setUploadStatus('error');
      setShowUploadOptions(false);
    }
  };

  // Function to handle camera capture
  const handleCameraCapture = async () => {
    console.log('Camera capture handler triggered');
    
    try {
      console.log('Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Camera permission denied');
        setUploadError('Camera permission not granted');
        setUploadStatus('error');
        setShowUploadOptions(false);
        return;
      }
      
      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing completely to avoid any cropping
        quality: 1,
      });
      
      // Close modal immediately regardless of result
      setShowUploadOptions(false);
      
      console.log('Camera result:', result);
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Camera capture was canceled or no photo taken');
        return;
      }
      
      const asset = result.assets[0];
      const fileName = `photo_${Date.now()}.jpg`;
      const uri = asset.uri;
      const mimeType = 'image/jpeg';
      
      console.log('Captured photo:', { fileName, uri });
      
      setCurrentFileName(fileName);
      
      // Start upload process
      setLoading(true);
      setLoadingStage('uploading');
      setUploadStatus('uploading');
      startLoadingAnimation();
      
      try {
        console.log('Starting upload with ResumeService...');
        const response = await ResumeService.uploadResume(uri, fileName, mimeType);
        console.log('Upload successful, response received:', response);
        
        // Extract upload ID from response
        let uploadId = response?.upload_id;
        
        if (!uploadId) {
          console.log('No upload_id found in response, using fallback');
          uploadId = `temp_${Date.now()}`;
        }
        
        console.log('Setting upload ID:', uploadId);
        setUploadId(uploadId);
        setUploadStarted(true);
        setUploadStatus('processing');
        analyzeResume(uploadId);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError('Failed to upload photo. Please try again.');
        setUploadStatus('error');
        setLoading(false);
        
        if (loadingAnimationCleanupRef.current) {
          loadingAnimationCleanupRef.current();
          loadingAnimationCleanupRef.current = null;
        }
      } finally {
        setShowUploadOptions(false);
      }
    } catch (cameraError) {
      console.error('Camera error:', cameraError);
      setUploadError('Error taking photo. Please try again.');
      setUploadStatus('error');
      setShowUploadOptions(false);
    }
  };

  // Function to handle gallery image pick
  const handleGalleryPick = async () => {
    console.log('Gallery pick handler triggered');
    
    try {
      console.log('Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Media library permission denied');
        setUploadError('Gallery access denied. Please enable media access in your device settings.');
        setUploadStatus('error');
        setShowUploadOptions(false);
        return;
      }
      
      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false, // Disable editing completely to avoid any cropping
      });
      
      // Close modal immediately regardless of result
      setShowUploadOptions(false);
      
      console.log('Gallery pick result:', result);
      
      if (result.canceled) {
        console.log('Gallery pick cancelled');
        return;
      }
      
      // Process the selected image
      const imageUri = result.assets[0].uri;
      const fileName = imageUri.split('/').pop() || 'resume_image.jpg';
      const mimeType = result.assets[0].mimeType || FileUploadService.getMimeType(fileName);
      
      console.log(`Processing selected image: ${fileName}`);
      
      // Set file metadata like in camera capture
      setCurrentFileName(fileName);
      
      // Start loading animation
      setLoading(true);
      setLoadingStage('uploading');
      setUploadStatus('uploading');
      startLoadingAnimation();
      
      try {
        // Upload the file using the correct method signature
        console.log('Starting upload with ResumeService...');
        const response = await ResumeService.uploadResume(imageUri, fileName, mimeType);
        console.log('Upload successful, response received:', response);
        
        // Extract upload ID from response
        let uploadId = response?.upload_id;
        
        if (!uploadId) {
          console.log('No upload_id found in response, using fallback');
          uploadId = `temp_${Date.now()}`;
        }
        
        console.log('Setting upload ID:', uploadId);
        setUploadId(uploadId);
        setUploadStarted(true);
        setUploadStatus('processing'); // Added this line
        analyzeResume(uploadId);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError('Failed to upload image. Please try again.');
        setUploadStatus('error');
        setLoading(false);
        
        if (loadingAnimationCleanupRef.current) {
          loadingAnimationCleanupRef.current();
          loadingAnimationCleanupRef.current = null;
        }
      } finally {
        setShowUploadOptions(false);
      }
    } catch (galleryError) {
      console.error('Gallery error:', galleryError);
      setUploadError('Error selecting image. Please try again.');
      setUploadStatus('error');
      setShowUploadOptions(false);
    }
  };

  // Function to analyze resume
  const analyzeResume = async (uploadId: string) => {
    setLoadingStage('parsing');
    
    try {
      console.log('Starting resume analysis with upload ID:', uploadId);
      
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Requesting resume feedback for upload ID:', uploadId);
      
      // Make API call to analyze resume
      const response = await ResumeService.getResumeFeedback(uploadId);
      console.log('Resume feedback response from service:', JSON.stringify(response, null, 2));
      
      setCategoryScores(response.categoryScores);
      console.log('Category scores set to:', JSON.stringify(response.categoryScores, null, 2));
      
      // Transform feedbackMessages from object to array format
      const feedbackArray: Array<{text: string, section: string}> = [];
      
      // Check if feedbackMessages is already an array
      if (Array.isArray(response.feedbackMessages)) {
        console.log('Feedback messages is already an array:', response.feedbackMessages);
        setFeedbackMessages(response.feedbackMessages);
      } else {
        // Process each category of feedback
        console.log('Processing feedback messages object:', JSON.stringify(response.feedbackMessages, null, 2));
        Object.entries(response.feedbackMessages).forEach(([category, messages]) => {
          console.log(`Processing category ${category}, messages:`, messages);
          if (Array.isArray(messages)) {
            messages.forEach(message => {
              feedbackArray.push({
                section: category,
                text: message
              });
            });
          } else if (typeof messages === 'string') {
            // Handle case where feedback might be a string
            feedbackArray.push({
              section: category,
              text: messages
            });
          }
        });
        
        console.log('Transformed feedback array:', feedbackArray);
        setFeedbackMessages(feedbackArray);
      }
      
      setLoadingStage('analyzing');
      
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoadingStage('feedback');
      
      // Simulate feedback delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoading(false);
      setUploadStatus('success');
      
      // Clean up animation when analysis is complete
      if (loadingAnimationCleanupRef.current) {
        loadingAnimationCleanupRef.current();
        loadingAnimationCleanupRef.current = null;
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setUploadError('Failed to analyze resume. Please try again.');
      setUploadStatus('error');
      setLoading(false);
      
      // Clean up animation on error
      if (loadingAnimationCleanupRef.current) {
        loadingAnimationCleanupRef.current();
        loadingAnimationCleanupRef.current = null;
      }
    }
  };

  // Function to match resume with job
  const matchResumeWithJob = async () => {
    if (!uploadId || !selectedJob) {
      Alert.alert('Error', 'Please upload a resume and select a job first.');
      return;
    }
    
    setLoading(true);
    setLoadingStage('matching');
    startJobMatchingAnimation(); // Use faster animation for job matching
    
    try {
      console.log(`Matching resume ${uploadId} with job ${selectedJob.id}`);
      const result = await ResumeService.matchResumeWithJob(uploadId, selectedJob.id);
      
      // Validate the result to ensure we have actual data
      if (!result || typeof result.match_score !== 'number') {
        throw new Error('Invalid match result received from server');
      }
      
      console.log('Match result:', result);
      
      // Update the job in the jobs array with the match score
      const updatedJobs = jobs.map(job => {
        if (job.id === selectedJob.id) {
          return { ...job, match: result.match_score };
        }
        return job;
      });
      
      setJobs(updatedJobs);
      setMatchResult(result);
      setShowMatchResultModal(true);
      
      // Update the match score in the mock global state
      try {
        // Get current saved jobs from mock global state
        const savedJobs = mockGlobalStateService.getSavedJobs();
        
        // Find if this job exists in saved jobs
        const savedJobIndex = savedJobs.findIndex(job => job.id === selectedJob.id);
        
        if (savedJobIndex >= 0) {
          // Update existing job in saved jobs
          const updatedJob = {
            ...savedJobs[savedJobIndex],
            match_score: result.match_score
          };
          mockGlobalStateService.saveJob(updatedJob);
          console.log(`Updated job ${selectedJob.id} match score in global state`);
        } else {
          // If job isn't in saved jobs, we can optionally save it
          // This is commented out as we may only want to update existing saved jobs
          // const jobToSave = {
          //   ...selectedJob,
          //   match_score: result.match_score
          // };
          // mockGlobalStateService.saveJob(jobToSave);
          console.log(`Job ${selectedJob.id} not found in saved jobs, skipping global state update`);
        }
      } catch (stateError) {
        console.error('Error updating match score in global state:', stateError);
        // We don't want to fail the whole operation if just the state update fails
      }
    } catch (error) {
      console.error('Error matching resume with job:', error);
      
      // Provide a more informative error message
      const errorMessage = error.message || 'Unknown error';
      Alert.alert(
        'Resume Matching Failed', 
        `Could not match your resume with this job. ${errorMessage}\n\nPlease check your internet connection and try again.`
      );
    } finally {
      setLoading(false);
      
      // Clean up animation when matching is complete
      if (loadingAnimationCleanupRef.current) {
        loadingAnimationCleanupRef.current();
        loadingAnimationCleanupRef.current = null;
      }
    }
  };

  // Function to handle job selection
  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setMatchResult(null); // Reset match result when a new job is selected
  };

  // Function to handle category press
  const handleCategoryPress = (categoryKey: string, messages: Array<{text: string, section: string}>) => {
    // Toggle expanded state for the category
    setExpandedCategory(prev => prev === categoryKey ? null : categoryKey);
    console.log(`Category pressed: ${categoryKey}`, messages);
  };

  // Function to add a custom job
  const addCustomJob = () => {
    if (!customJobTitle || !customJobDescription) {
      Alert.alert('Error', 'Please provide at least a job title and description.');
      return;
    }
    
    const skillsArray = customJobSkills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
    
    const newJob: Job = {
      id: `custom-${Date.now()}`,
      title: customJobTitle,
      company: customJobCompany || 'Custom Company',
      location: 'Custom Location',
      description: customJobDescription,
      skills: skillsArray,
      match: 0, // Initial match score is 0 until matched
      url: '',
      date_posted: new Date().toISOString()
    };
    
    setJobs([newJob, ...jobs]);
    setSelectedJob(newJob);
    setShowCustomJobInput(false);
    
    // Reset form fields
    setCustomJobTitle('');
    setCustomJobCompany('');
    setCustomJobDescription('');
    setCustomJobSkills('');
  };

  return (
    <View style={styles.container}>
      <HeaderWithToggle
        title="CareerDaddy"
        options={[
          { id: 'analyse', label: 'Analyse' },
          { id: 'match', label: 'Match' }
        ]}
        activeOptionId={activeTab}
        onOptionChange={(id) => setActiveTab(id as 'analyse' | 'match')}
      />
      
      <View style={styles.content}>
        {activeTab === 'analyse' && (
          <View style={styles.analysisContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <CircularProgress 
                  percentage={loadingProgress} 
                  size={100} 
                  strokeWidth={10} 
                  progressColor={COLORS.nightSky}
                />
                <Text style={styles.loadingText}>
                  {loadingStage === 'uploading' && `Uploading Resume${loadingDots}`}
                  {loadingStage === 'parsing' && `Parsing Resume${loadingDots}`}
                  {loadingStage === 'analyzing' && `Analyzing Resume${loadingDots}`}
                  {loadingStage === 'feedback' && `Creating Feedback${loadingDots}`}
                </Text>
              </View>
            ) : categoryScores ? (
              <>
                {/* Current CV display */}
                <TouchableOpacity 
                  style={styles.currentCVContainer}
                  onPress={() => setShowUploadOptions(true)}
                >
                  <View style={styles.currentCVContent}>
                    <Ionicons name="document" size={20} color={COLORS.nightSky} />
                    <View style={styles.currentCVTextContainer}>
                      <Text style={styles.currentCVTitle}>Current Resume</Text>
                      <Text style={styles.currentCVFilename} numberOfLines={1} ellipsizeMode="middle">
                        {currentFileName || "Unknown filename"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.currentCVAction}>
                    <LinearGradient
                      colors={[COLORS.rose, COLORS.sky]}
                      style={styles.replaceGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.currentCVActionText}>Replace</Text>
                      <Ionicons name="arrow-up-circle" size={16} color="white" />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                
                <ResumeAnalysisResults 
                  feedbackMessages={feedbackMessages.map(msg => ({
                    section: msg.section,  
                    text: msg.text
                  }))}
                  overallScore={categoryScores.overall || 0}
                  categoryScores={categoryScores}
                />
              </>
            ) : (
              <View style={styles.uploadContainer}>
                <GradientButton
                  title="Upload Resume"
                  onPress={() => setShowUploadOptions(true)}
                  style={styles.gradientUploadButton}
                  icon={<Ionicons name="cloud-upload" size={24} color={COLORS.white} />}
                />
                <Text style={styles.uploadDescription}>
                  Upload your resume to get feedback and to match it to job descriptions
                </Text>
              </View>
            )}
          </View>
        )}
        {activeTab === 'match' && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1 }}>
              {!uploadId ? (
                <View style={styles.uploadContainer}>
                  <GradientButton
                    title="Upload Resume"
                    onPress={() => setShowUploadOptions(true)}
                    style={styles.gradientUploadButton}
                    icon={<Ionicons name="cloud-upload" size={24} color={COLORS.white} />}
                  />
                  <Text style={styles.uploadDescription}>
                    Upload your resume to match it with job descriptions
                  </Text>
                </View>
              ) : loading ? (
                <View style={styles.loadingContainer}>
                  <CircularProgress 
                    percentage={loadingProgress} 
                    size={100} 
                    strokeWidth={10} 
                    progressColor={COLORS.nightSky}
                  />
                  <Text style={styles.loadingText}>
                    {loadingStage === 'uploading' && `Uploading Resume${loadingDots}`}
                    {loadingStage === 'parsing' && `Parsing Resume${loadingDots}`}
                    {loadingStage === 'analyzing' && `Analyzing Resume${loadingDots}`}
                    {loadingStage === 'feedback' && `Creating Feedback${loadingDots}`}
                  </Text>
                </View>
              ) : (
                <>
                  {/* Current CV display */}
                  <TouchableOpacity 
                    style={styles.currentCVContainer}
                    onPress={() => setShowUploadOptions(true)}
                  >
                    <View style={styles.currentCVContent}>
                      <Ionicons name="document" size={20} color={COLORS.nightSky} />
                      <View style={styles.currentCVTextContainer}>
                        <Text style={styles.currentCVTitle}>Current Resume</Text>
                        <Text style={styles.currentCVFilename} numberOfLines={1} ellipsizeMode="middle">
                          {currentFileName || "Unknown filename"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.currentCVAction}>
                      <LinearGradient
                        colors={[COLORS.rose, COLORS.sky]}
                        style={styles.replaceGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.currentCVActionText}>Replace</Text>
                        <Ionicons name="arrow-up-circle" size={16} color="white" />
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.jobSelectionHeader}>
                    <Text style={styles.sectionHeader}>Select a Job to Match</Text>
                    <TouchableOpacity 
                      style={styles.addCustomJobButton}
                      onPress={() => router.push('/trackpal-add-application')}
                    >
                      <LinearGradient
                        colors={[COLORS.rose, COLORS.sky]}
                        style={styles.addJobButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="add-circle" size={18} color={COLORS.white} />
                        <Text style={styles.addJobButtonText}>Add Job</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.matchInstructionText}>
                    Choose a job to see how well your resume matches and get improvement suggestions
                  </Text>
                  
                  {/* Custom job input form */}
                  {showCustomJobInput && (
                    <View style={styles.customJobForm}>
                      <TextInput
                        style={styles.customJobInput}
                        placeholder="Job Title *"
                        value={customJobTitle}
                        onChangeText={setCustomJobTitle}
                      />
                      <TextInput
                        style={styles.customJobInput}
                        placeholder="Company Name"
                        value={customJobCompany}
                        onChangeText={setCustomJobCompany}
                      />
                      <TextInput
                        style={[styles.customJobInput, styles.customJobTextArea]}
                        placeholder="Job Description *"
                        value={customJobDescription}
                        onChangeText={setCustomJobDescription}
                        multiline
                        numberOfLines={4}
                      />
                      <TextInput
                        style={styles.customJobInput}
                        placeholder="Skills (comma separated)"
                        value={customJobSkills}
                        onChangeText={setCustomJobSkills}
                      />
                      <TouchableOpacity
                        style={styles.addCustomJobSubmitButton}
                        onPress={addCustomJob}
                      >
                        <Text style={styles.addCustomJobSubmitText}>Add Job</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <ScrollView style={styles.jobListScrollView}>
                    <View style={styles.jobList}>
                      {jobs.length === 0 ? (
                        <View style={styles.noJobsContainer}>
                          <Text style={styles.noJobsText}>No saved jobs found to match with your resume.</Text>
                          <View style={styles.findJobsButtonContainer}>
                            <LinearGradient
                              colors={[COLORS.rose, COLORS.sky]}
                              style={styles.findJobsButtonGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              <TouchableOpacity 
                                onPress={() => router.push('/pathfinder')}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                              >
                                <Ionicons name="search" size={20} color={COLORS.white} />
                                <Text style={styles.findJobsButtonText}>Find Jobs</Text>
                              </TouchableOpacity>
                            </LinearGradient>
                          </View>
                        </View>
                      ) : (
                        <>
                          {jobs.map((job) => (
                            <TrackpalStyleJobCard
                              key={job.id}
                              job={job}
                              onPress={handleJobSelect}
                              isSelected={selectedJob?.id === job.id}
                              showMatchScore={job.match ? true : false}
                            />
                          ))}
                          
                          {jobs.length < 3 && (
                            <View style={styles.findMoreJobsButtonContainer}>
                              <LinearGradient
                                colors={[COLORS.rose, COLORS.sky]}
                                style={styles.findJobsButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                              >
                                <TouchableOpacity 
                                  onPress={() => router.push('/pathfinder')}
                                  style={{ flexDirection: 'row', alignItems: 'center' }}
                                >
                                  <Ionicons name="search" size={20} color={COLORS.white} />
                                  <Text style={styles.findJobsButtonText}>Find More Jobs</Text>
                                </TouchableOpacity>
                              </LinearGradient>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </ScrollView>
                  
                  {selectedJob && !matchResult && (
                    <View style={styles.floatingMatchButton}>
                      <LinearGradient
                        colors={[COLORS.rose, COLORS.sky]}
                        style={styles.matchButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <TouchableOpacity 
                          onPress={matchResumeWithJob}
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                          <Ionicons name="git-compare" size={20} color={COLORS.white} />
                          <Text style={styles.matchButtonText}>Match Resume</Text>
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  )}
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
      {showUploadOptions && (
        <UploadOptionsModal
          visible={showUploadOptions}
          onClose={() => setShowUploadOptions(false)}
          onDocumentSelect={handleDocumentPick}
          onCameraSelect={handleCameraCapture}
          onGallerySelect={handleGalleryPick}
        />
      )}
      {showMatchResultModal && matchResult && (
        <View style={styles.matchResultModal}>
          <View style={styles.matchResultModalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowMatchResultModal(false)}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.nightSky} />
            </TouchableOpacity>
            
            <Text style={styles.resultTitle}>Match Results</Text>
            <View style={styles.matchScoreContainer}>
              <CircularProgress 
                percentage={matchResult.match_score} 
                size={80} 
                strokeWidth={8}
                progressColor={getMatchColor(matchResult.match_score)}
                textColor={COLORS.nightSky}
                textSize={20}
              />
              <View style={styles.matchScoreTextContainer}>
                <Text style={styles.matchScoreLabel}>Your resume matches</Text>
                <Text style={styles.matchScoreValue}>{formatPercentage(matchResult.match_score)}</Text>
                <Text style={styles.matchScoreJob}>of requirements for {selectedJob.title}</Text>
              </View>
            </View>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {matchResult.missing_keywords && matchResult.missing_keywords.length > 0 && (
                <View style={styles.missingKeywordsContainer}>
                  <Text style={styles.missingKeywordsTitle}>Missing Keywords</Text>
                  <View style={styles.keywordTagsContainer}>
                    {matchResult.missing_keywords.map((keyword, index) => (
                      <View key={index} style={styles.keywordTag}>
                        <Text style={styles.keywordTagText}>{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {matchResult.improvement_suggestions && matchResult.improvement_suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Improvement Suggestions</Text>
                  {matchResult.improvement_suggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionItem}>
                      <Text style={styles.suggestionBullet}>•</Text>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            
            <GradientButton
              title="Close"
              onPress={() => setShowMatchResultModal(false)}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}