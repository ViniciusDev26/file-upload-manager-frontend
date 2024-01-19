import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Copy, FileArchive } from "lucide-react"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import axios from "axios"
import { Progress } from "@/components/ui/progress"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Helmet } from "react-helmet-async"

const uploadFormSchema = z.object({
  file: z.instanceof(File).nullable(),
  started: z.boolean().default(false),
  isUploading: z.boolean().default(false),
  loaded: z.number().default(0),
  total: z.number().default(0),
  percent: z.number().default(0),
  shareUrl: z.string().default(''),
  copied: z.boolean().default(false)
})
type uploadFormType = z.infer<typeof uploadFormSchema>

export const Home = () => {
  const uploadForm = useForm<uploadFormType>({
    resolver: zodResolver(uploadFormSchema),
  })
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    noClick: true,
    accept: {
      "application/zip": [".zip"] 
    }
  })

  function handleDrop(acceptedFiles: Array<File | null>) {
    const file = acceptedFiles[0];
    if(!file) return

    uploadForm.setValue("file", file);
    uploadForm.trigger("file")
  }

  const requestController = new AbortController()
  async function submitFile(params: uploadFormType) {
    if(!params.file) return

    const { data } = await api.post("/file/upload", {
      name: params.file?.name,
      contentType: params.file?.type,
      contentLength: params.file?.size,
    })

    
    uploadForm.watch("percent", 0)

    uploadForm.setValue("started", true)
    uploadForm.setValue("isUploading", true)

    const buffer = await params.file.arrayBuffer()
    await axios.put(data.url, buffer, {
      signal: requestController.signal,
      headers: {
        "Content-Type": params.file.type
      },
      onUploadProgress: (progressEvent) => {
        const progress: number = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total ?? 0)
        );

        uploadForm.setValue("loaded", progressEvent.loaded)
        uploadForm.setValue("total", progressEvent.total ?? 0)
        uploadForm.setValue("percent", progress)
      }
    })

    uploadForm.setValue("shareUrl", `${api.defaults.baseURL}/file/${data.id}`)
    uploadForm.setValue("isUploading", false)

    toast.success("File uploaded successfully")
  }

  function abortUpload() {
    requestController.abort()
    uploadForm.setValue("isUploading", false)
    uploadForm.setValue("shareUrl", '')

    toast.error("File upload aborted")
  }

  function copyLinkToClipboard() {
    toast.success("Link copied to clipboard")
    navigator.clipboard.writeText(uploadForm.getValues("shareUrl"))
    uploadForm.setValue("copied", true)
  }

  function convertBytesToMb(bytes: number) {
    return bytes / 1024 / 1024
  }

  return (
    <>
      <Helmet title="Home" />
      <div className="flex h-screen items-center justify-center">
        <Card className="w-1/4 flex flex-col items-center justify-center bg-card text-card-foreground">
          <CardHeader>
            <p className="text-xl">Upload File (MAX: 1GB)</p>
          </CardHeader>
          <CardContent className="gap-2 w-full">
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(submitFile)}>
                <FormField 
                  name="files"
                  render={
                    () => (
                      <FormItem>
                        <FormControl>
                          <div {...getRootProps()}>
                            {uploadForm.getValues("file") ? (
                              <Label htmlFor="file" className="border border-dashed h-[256px] w-full flex gap-4 flex-col items-center justify-center rounded text-muted-foreground">
                                <FileArchive size={48} className="mr-4" />
                                <div>
                                  <p className="text-center">{uploadForm.getValues("file")?.name}</p>
                                  <p className="text-center">{convertBytesToMb(uploadForm.getValues("file")?.size ?? 0).toFixed(2)} MB</p>
                                </div>

                                {uploadForm.getValues("started") && (
                                  <>
                                    <Progress className="w-[60%] rounded mb-[-8px]" value={uploadForm.getValues("percent")} />
                                    <p className="text-center">{uploadForm.getValues("percent")}%</p>
                                  </>
                                )}
                              </Label>
                            ) : 
                              (
                                <Label htmlFor="file" className="border border-dashed h-[256px] w-full flex items-center justify-center text-muted-foreground">
                                  <FileArchive size={32} className="mr-4" />
                                  {
                                    isDragActive ? (
                                      <p className="text-center">Drop your files here</p>
                                    ) : (
                                      <p className="text-center">Drag and drop your files here</p>
                                    )
                                  }
                                </Label>
                              )
                            }
                            <Input id="file" {...getInputProps()} accept="application/zip" className="hidden" onChange={e => handleDrop([e.target.files?.item(0) ?? null])} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }
                />
                <div className="mt-4 flex flex-row justify-end">
                  {
                    uploadForm.getValues("isUploading") && (
                      <Button onClick={abortUpload}>Cancel</Button>
                    )
                  }
                  {
                    uploadForm.getValues("shareUrl") && (
                      <Button onClick={() => uploadForm.reset()}>Upload another file</Button>
                    )
                  }
                  {
                    !uploadForm.getValues("started") && (
                      <Button disabled={uploadForm.getValues("isUploading")} type="submit">Upload</Button>
                    )
                  }
                </div>
              </form>
            </Form>
          </CardContent>
          {
            uploadForm.getValues("shareUrl") && (
              <CardFooter className="border rounded w-full flex items-center justify-center py-4">
                <Button variant="link" onClick={copyLinkToClipboard}><Copy /></Button>
                <p className="text-sm">{uploadForm.getValues("shareUrl")}</p>
              </CardFooter>
            )
          }
        </Card>
      </div>
    </>
  )
}