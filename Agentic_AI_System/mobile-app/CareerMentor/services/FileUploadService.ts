import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { API_BASE_URL, API_FALLBACK_URLS, ENDPOINTS, API_TIMEOUT } from '../constants/ApiEndpoints';

/**
 * Service for handling file uploads with retry mechanism
 */
export class FileUploadService {
  /**
   * Upload a file with retry mechanism using multiple API URLs
   * @param uri File URI to upload
   * @param fileName File name
   * @param fileType MIME type of the file
   * @param endpoint API endpoint to upload to
   * @returns Response from the server
   */
  static async uploadFileWithRetry(
    uri: string,
    fileName: string,
    fileType: string,
    endpoint: string = ENDPOINTS.RESUME.UPLOAD
  ) {
    // Try the primary URL first, then fallback URLs
    let lastError: Error | null = null;
    
    // Try primary URL first
    try {
      const result = await this.uploadFile(API_BASE_URL + endpoint, uri, fileName, fileType);
      return result;
    } catch (error) {
      console.error(`Upload failed with primary URL: ${API_BASE_URL}`, error);
      lastError = error as Error;
    }
    
    // Try fallback URLs
    for (let i = 0; i < API_FALLBACK_URLS.length; i++) {
      try {
        console.log(`Retrying upload with URL: ${API_FALLBACK_URLS[i]} (Attempt ${i + 2}/${API_FALLBACK_URLS.length + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        const result = await this.uploadFile(API_FALLBACK_URLS[i] + endpoint, uri, fileName, fileType);
        return result;
      } catch (error) {
        console.error(`Upload failed with URL: ${API_FALLBACK_URLS[i]}`, error);
        console.error("Error details:", (error as Error).name, (error as Error).message);
        lastError = error as Error;
      }
    }
    
    // If all attempts failed, throw the last error
    throw lastError || new Error('All upload attempts failed');
  }
  
  /**
   * Upload a file to a specific URL
   * @param url Full URL to upload to
   * @param uri File URI
   * @param fileName File name
   * @param fileType MIME type of the file
   * @returns Response from the server
   */
  private static async uploadFile(url: string, uri: string, fileName: string, fileType: string) {
    console.log(`🔗 POST → ${url} (File: ${fileName})`);
    
    // Set up AbortController with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      
      // Ensure proper URI formatting based on platform
      const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      
      // Ensure we have a valid file name with extension
      const finalFileName = fileName.includes('.') ? fileName : 
        fileType === 'image/jpeg' ? `${fileName}.jpg` : 
        fileType === 'image/png' ? `${fileName}.png` : 
        fileType === 'application/pdf' ? `${fileName}.pdf` : 
        fileName;
      
      console.log(`Uploading file: ${finalFileName} (${fileType}) from ${fileUri}`);
      
      // Append file to form data with proper metadata
      formData.append('file', {
        uri: fileUri,
        name: finalFileName,
        type: fileType,
      } as any);
      
      // Send the request
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Let the browser set the Content-Type header with boundary
          // 'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error(`Upload failed with status ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Parse and return the response
      return await response.json();
    } catch (error) {
      console.error(`Upload error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Get the MIME type based on file extension
   * @param fileName File name with extension
   * @returns MIME type string
   */
  static getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'heic':
        return 'image/heic';
      default:
        return 'application/octet-stream';
    }
  }
  
  /**
   * Pick a document from the device
   * @returns Document info or null if canceled
   */
  static async pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf', 
          'image/*', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/heic'
        ],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return null;
      }
      
      const file = result.assets[0];
      return {
        uri: file.uri,
        name: file.name || 'document',
        mimeType: this.getMimeType(file.name || 'document'),
      };
    } catch (error) {
      console.error('Error picking document:', error);
      throw error;
    }
  }
  
  /**
   * Take a photo with the camera
   * @returns Photo info or null if canceled
   */
  static async takePhoto() {
    try {
      console.log("Requesting camera permissions...");
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        console.log("Camera permission denied");
        throw new Error('Camera permission not granted');
      }
      
      console.log("Launching camera...");
      // Take a photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8, // Slightly compress for better upload performance
        exif: false, // Don't need EXIF data
      });
      
      console.log("Camera result:", result);
      
      if (result.canceled) {
        console.log("Camera capture canceled");
        return null;
      }
      
      const photo = result.assets[0];
      const timestamp = Date.now();
      const fileName = `resume_photo_${timestamp}.jpg`;
      
      console.log("Captured photo:", {
        uri: photo.uri,
        name: fileName
      });
      
      return {
        uri: photo.uri,
        name: fileName,
        mimeType: 'image/jpeg',
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }
}
