import { useEffect, useState } from "react";
import { Heart, ShieldCheck } from "lucide-react";
import authService from "../../services/authService";
import platformService from "../../services/platformService";

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const user = authService.getStoredUser();

  const loadPosts = async () => {
    const response = await platformService.getCommunityPosts();
    setPosts(response.data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    await platformService.createCommunityPost({
      content: form.content.value,
      imageUrl: form.imageUrl.value,
    });

    setMessage("Your post is now live in the Sakhi community.");
    form.reset();
    await loadPosts();
  };

  const toggleLike = async (id) => {
    await platformService.toggleCommunityLike(id);
    await loadPosts();
  };

  const removePost = async (id) => {
    await platformService.deleteCommunityPost(id, "Removed by moderation review");
    await loadPosts();
  };

  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-center">
          <span className="section-badge">Supportive community</span>
          <h1>Share your journey with women who understand it</h1>
          <p>Talk openly, ask practical questions, and build confidence through moderated peer support.</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="panel-card">
              <h2 className="panel-title">Create a post</h2>
              <p className="panel-subtitle">You can add text and an optional image URL for context.</p>

              <form onSubmit={handleSubmit}>
                <textarea name="content" className="form-control" rows="5" placeholder="What would you like to share?" required />
                <input name="imageUrl" className="form-control mt-3" placeholder="Optional image URL" />
                {message && <div className="alert alert-success mt-3">{message}</div>}
                <button className="btn btn-primary mt-3 w-100">Publish post</button>
              </form>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="community-stack">
              {posts.map((post) => {
                const liked = post.likes?.some((like) => like._id === user?.id || like === user?.id || like === user?._id);
                return (
                  <div className="panel-card" key={post._id}>
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <h3 className="panel-title mb-1">{post.author?.name}</h3>
                        <p className="muted-copy mb-2">{new Date(post.createdAt).toLocaleString()}</p>
                      </div>
                      {post.author?.role === "doctor" && (
                        <span className="doctor-chip"><ShieldCheck size={16} /> Doctor</span>
                      )}
                    </div>

                    <p className="mb-3">{post.content}</p>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt="Community post" className="community-image" />
                    )}

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <button className="btn btn-outline-primary rounded-pill" onClick={() => toggleLike(post._id)}>
                        <Heart size={16} className="me-2" fill={liked ? "currentColor" : "none"} />
                        {post.likes?.length || 0} likes
                      </button>

                      {(user?.role === "doctor" || post.author?._id === user?.id || post.author?._id === user?._id) && (
                        <button className="btn btn-link text-danger" onClick={() => removePost(post._id)}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
