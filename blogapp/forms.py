from django import forms
from .models import Comment


class EmailPostForm(forms.Form):
    name = forms.CharField(max_length=255, label='Name')
    email = forms.EmailField(label='Email')
    to = forms.EmailField(label='To')
    comments = forms.CharField(required=False, widget=forms.Textarea(), label='Comments')


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ('name', 'email', 'body')
