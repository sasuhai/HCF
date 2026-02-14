/**
 * File upload helpers using Base64 encoding for Supabase Database (JSONB)
 * This allows file uploads without External Storage bucket (simplified architecture)
 */

/**
 * Convert file to Base64 data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Compress and resize image aggressively to keep under 100KB
 * Uses iterative compression to meet target size
 * @param {File} file - Image file
 * @param {number} targetSizeKB - Target size in KB (default 100KB)
 * @returns {Promise<string>} - Compressed Base64 data URL
 */
export const compressImage = (file, targetSizeKB = 100) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                // Start with reasonable dimensions
                let maxWidth = 1024;
                let maxHeight = 1024;
                let quality = 0.85;

                const compress = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to Base64
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

                    // Calculate size in KB
                    const sizeKB = (compressedBase64.length * 3) / 4 / 1024;

                    // If still too large, reduce quality or dimensions
                    if (sizeKB > targetSizeKB) {
                        if (quality > 0.3) {
                            // Reduce quality
                            quality -= 0.1;
                            compress();
                        } else if (maxWidth > 400 || maxHeight > 400) {
                            // Reduce dimensions
                            maxWidth = Math.max(400, Math.floor(maxWidth * 0.8));
                            maxHeight = Math.max(400, Math.floor(maxHeight * 0.8));
                            quality = 0.85; // Reset quality
                            compress();
                        } else {
                            // Can't compress further, accept current size
                            resolve(compressedBase64);
                        }
                    } else {
                        // Size is good!
                        resolve(compressedBase64);
                    }
                };

                compress();
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};

/**
 * Process and validate a single file
 * @param {File} file - The file to process
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Object>} - Object with base64 data and metadata
 */
export const processFile = async (file, onProgress = null) => {
    if (!file) {
        throw new Error('No file provided');
    }

    // Validate file size (max 5MB for original, will be compressed)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
    }

    // Validate file type
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed');
    }

    if (onProgress) onProgress(30);

    let base64Data;
    let finalSize;

    // Handle images - compress aggressively to < 100KB
    if (file.type.startsWith('image/')) {
        base64Data = await compressImage(file, 100); // Target 100KB
        // Calculate actual size
        finalSize = (base64Data.length * 3) / 4;
    } else {
        // Handle PDFs - convert first page to compressed image
        // This keeps PDFs under 100KB too
        try {
            // For now, just compress PDFs as-is if small enough
            // In future, could use pdf.js to convert to image
            const pdfBase64 = await fileToBase64(file);
            const pdfSizeKB = (pdfBase64.length * 3) / 4 / 1024;

            if (pdfSizeKB > 200) {
                // PDF too large, suggest user to scan as image instead
                throw new Error('PDF too large. Please scan as JPG/PNG image instead (max 5MB)');
            }

            base64Data = pdfBase64;
            finalSize = (pdfBase64.length * 3) / 4;
        } catch (error) {
            throw new Error('Failed to process PDF: ' + error.message);
        }
    }

    if (onProgress) onProgress(100);

    return {
        data: base64Data,
        name: file.name,
        type: file.type,
        originalSize: file.size,
        compressedSize: Math.round(finalSize),
        uploadedAt: new Date().toISOString()
    };
};

/**
 * Process multiple files for a submission
 * @param {Object} files - Object containing file inputs
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Object>} - Object with processed file data
 */
export const processSubmissionFiles = async (files, onProgress = null) => {
    const fileData = {};
    const fileFields = [
        'gambarIC',
        'gambarKadIslam',
        'gambarSijilPengislaman',
        'dokumenLain1',
        'dokumenLain2',
        'dokumenLain3'
    ];

    let completedCount = 0;
    const totalFiles = fileFields.filter(field => files[field] && files[field][0]).length;

    if (totalFiles === 0) {
        return fileData; // No files to process
    }

    for (const field of fileFields) {
        const fileList = files[field];
        if (fileList && fileList[0]) {
            const file = fileList[0];

            try {
                // Process individual file
                const processedFile = await processFile(file, (progress) => {
                    // Calculate overall progress
                    if (onProgress) {
                        const overallProgress = ((completedCount + (progress / 100)) / totalFiles) * 100;
                        onProgress(Math.round(overallProgress), field);
                    }
                });

                fileData[field] = processedFile;
                completedCount++;

                // Update overall progress
                if (onProgress) {
                    const overallProgress = (completedCount / totalFiles) * 100;
                    onProgress(Math.round(overallProgress), field);
                }
            } catch (error) {
                console.error(`Error processing ${field}:`, error);
                throw new Error(`Failed to process ${field}: ${error.message}`);
            }
        }
    }

    return fileData;
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Estimate Base64 size from file size
 * @param {number} fileSize - Original file size in bytes
 * @returns {number} - Estimated Base64 size
 */
export const estimateBase64Size = (fileSize) => {
    // Base64 encoding increases size by ~33%
    return Math.ceil(fileSize * 1.33);
};

/**
 * Download Base64 file
 * @param {string} base64Data - Base64 data URL
 * @param {string} filename - Filename for download
 */
export const downloadBase64File = (base64Data, filename) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
