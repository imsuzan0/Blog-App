"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { author_service, blog_service, useAppData } from "@/context/AppContext";
import toast from "react-hot-toast";
import { blogCategories } from "../../new/page";
import { useParams, useRouter } from "next/navigation";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

const EditBlogPage = () => {
  const editor = useRef(null);
  const [content, setContent] = useState("");

  const router = useRouter();

  const [existingImage, setExistingImage] = useState<string | null>(null);

  const { id } = useParams();

  const config = useMemo(
    () => ({
      readonly: false, // all options from https://xdsoft.net/jodit/docs/,
      placeholder: "Start typings...",
    }),
    []
  );

  const { fetchBlogs } = useAppData();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    image: null,
    blogcontent: "",
  });

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    setFormData({ ...formData, image: file });
  };

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      try {
        const { data }: any = await axios.get(
          `${blog_service}/api/v1/blog/${id}`
        );

        const blog = data.blog;
        setFormData({
          title: blog.title,
          description: blog.description,
          category: blog.category,
          image: null,
          blogcontent: blog.content,
        });
        setContent(blog.content);
        setExistingImage(blog.image);
      } catch (error) {
        console.log("Error fetching blog for edit:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formDataToSend = new FormData();

    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("blogcontent", formData.blogcontent);
    if (formData.image) {
      formDataToSend.append("file", formData.image);
    }

    try {
      const token = Cookies.get("token");
      const { data }: any = await axios.post(
        `${author_service}/api/v1/blog/${id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(data.message);
      toast.success("Redirecting to blog page...");
      fetchBlogs();
      setTimeout(()=>{
        router.push(`/blog/${id}`);
      },3000)
    } catch (error) {
      toast.error("Problem while updating blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Add New Blog</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Label className="font-bold">Title</Label>
            <div className="flex justify-center items-center gap-2">
              <Input
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                name="title"
                required
                placeholder="Enter blog title"
              />
            </div>

            <Label>Description</Label>
            <div className="flex justify-center items-center gap-2">
              <Input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter Blog descripiton"
                required
              />
            </div>

            <Label className="font-bold">Category</Label>
            <Select
              onValueChange={(value: any) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={formData.category || "Select a category"}
                />
              </SelectTrigger>
              <SelectContent>
                {blogCategories.map((category, index) => (
                  <SelectItem key={index} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <Label className="font-bold">Image Upload</Label>
              {existingImage && !formData.image && (
                <img
                  src={existingImage}
                  className="w-40 h-40 object-cover rounded mb-4"
                  alt=""
                />
              )}
              <Input type="file" accept="image/*" onChange={handleFileChange} />
              <p className="text-sm text-muted-foreground">
                Upload an image for your blog.
              </p>
            </div>

            <JoditEditor
              ref={editor}
              value={content}
              config={config}
              tabIndex={1}
              onBlur={(newContent) => {
                setContent(newContent);
                setFormData({ ...formData, blogcontent: newContent });
              }}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBlogPage;
