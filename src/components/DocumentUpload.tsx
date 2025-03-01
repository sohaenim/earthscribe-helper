import React from "react";
import { Upload, FileText, X, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  className?: string;
  onDocumentsLoaded?: (documents: { name: string; content: string }[]) => void;
}

const DocumentUpload = ({ className, onDocumentsLoaded }: DocumentUploadProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
  const [loadedDocuments, setLoadedDocuments] = React.useState<string[]>([]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };
  
  const handleFiles = (newFiles: File[]) => {
    // Filter for allowed file types
    const allowedFiles = newFiles.filter(file => {
      const fileType = file.type;
      return (
        fileType === "application/pdf" ||
        fileType === "application/msword" ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileType === "text/plain" ||
        fileType === "application/x-latex"
      );
    });
    
    setFiles(prev => [...prev, ...allowedFiles]);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploadStatus("uploading");
    
    try {
      // Read file contents
      const fileContents = await Promise.all(
        files.map(async (file) => {
          const text = await file.text();
          return {
            name: file.name,
            content: text
          };
        })
      );

      // Store both name and content in parent
      await Promise.resolve(onDocumentsLoaded?.(fileContents));
      
      setUploadStatus("success");
      setLoadedDocuments(prev => [...prev, ...fileContents.map(f => f.name)]);
      
      // Close dialog after success
      setTimeout(() => {
        setIsOpen(false);
        // Reset upload state but keep loaded documents
        setTimeout(() => {
          setFiles([]);
          setUploadStatus("idle");
        }, 300);
      }, 1000);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus("error");
    }
  };
  
  const getFileIcon = (file: File) => {
    const fileType = file.type;
    
    if (fileType === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes("word")) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (fileType === "application/x-latex") {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground h-8 w-8"
          title="Upload documents"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="upload-description">
        <DialogHeader>
          <DialogTitle>Upload Research Document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div
            id="upload-description"
            className={cn(
              "border-2 border-dashed rounded-lg p-6 transition-colors text-center",
              isDragging ? "border-primary bg-primary/5" : "border-border",
              uploadStatus === "uploading" && "opacity-50 pointer-events-none"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadStatus === "success" ? (
              <div className="flex flex-col items-center gap-2 text-primary">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <p className="font-medium">Upload Successful</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  Drag and drop your document or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Support for PDF, DOCX, TXT, and LaTeX files
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt,.tex"
                  multiple
                  onChange={handleFileInput}
                  aria-label="File upload input"
                  disabled={uploadStatus === "uploading"}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={uploadStatus === "uploading"}
                >
                  Select File
                </Button>
              </>
            )}
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                {files.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(file)}
                      <span className="truncate">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                      disabled={uploadStatus === "uploading"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              {loadedDocuments.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Previously loaded: {loadedDocuments.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={uploadStatus === "uploading"}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={uploadFiles}
            disabled={files.length === 0 || uploadStatus !== "idle"}
            className="relative"
          >
            {uploadStatus === "uploading" ? (
              <span className="flex items-center gap-1">
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                Uploading
              </span>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUpload;
