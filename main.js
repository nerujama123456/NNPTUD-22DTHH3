async function AddComment(postId, content) {
    let resAll = await fetch("http://localhost:3000/comments");
    let comments = await resAll.json();

    let newComment = {
        id: getNextCommentId(comments),
        postId: postId,
        content: content,
        isDeleted: false
    };

    await fetch("http://localhost:3000/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment)
    });
}

// Cập nhật comment
async function UpdateComment(id, content) {
    await fetch("http://localhost:3000/comments/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content: content
        })
    });
}

// Xóa mềm comment
async function DeleteComment(id) {
    await fetch("http://localhost:3000/comments/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            isDeleted: true

        })
    });
}


// Load ban đầu
LoadData();