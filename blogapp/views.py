from django.shortcuts import render, get_object_or_404
from .models import Post, Comment
from django.views.generic import ListView
from .forms import CommentForm, EmailPostForm
from django.core.mail import send_mail
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class PostListView(ListView):
    queryset = Post.published.all()
    context_object_name = 'posts'
    paginate_by = 2
    template_name = 'blog/post/list.html'


def post_detail(request, year, month, day, slug):
    post = get_object_or_404(Post, slug=slug, status='published', publish__year=year, publish__month=month,
                             publish__day=day)

    comments = post.comments.filter(active=True)
    new_comment = None

    if request.method == 'POST':
        comment_form = CommentForm(data=request.POST)
        if comment_form.is_valid():
            new_comment = comment_form.save(commit=False)
            new_comment.post = post
            new_comment.save()
    else:
        comment_form = CommentForm()

    return render(request,
                  'blog/post/detail.html',
                  {'post': post,
                   'comments': comments,
                   'new_comment': new_comment,
                   'comment_form': comment_form})


def post_share(request, post_id):
    post = get_object_or_404(Post, id=post_id, status='published')
    send = False

    if request.method == 'POST':
        form = EmailPostForm(request.POST)
        if form.is_valid():
            cd = form.cleaned_data
            print(cd)
            post_url = request.build_absolute_uri(post.get_absolute_url())
            title = f"{cd['name']} sizga {post.title}ni o'qishni taklif etadi!"
            message = f"{post.title} maqolasini o'qing {post_url}\n\n" \
                      f"{cd['name']}ning izohi: {cd['comments']}"
            # send_mail dan oldin qo'shing:
            print(f"Email yuborilmoqda: {cd['to']}")
            print(f"FROM: {settings.EMAIL_HOST_USER}")

            send_mail(title, message, 'ramazontursunov007@gmail.com', [cd['to']], fail_silently=False)

            print("Email muvaffaqiyatli yuborildi!")
            send_mail(title, message, 'ramazontursunov007@gmail.com', [cd['to']], fail_silently=False)
            send = True

    else:
        form = EmailPostForm()

    return render(request, 'blog/post/share.html', {'post': post, 'form': form, 'send': send})
