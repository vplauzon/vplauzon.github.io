---
layout: empty
---
[
    {% for post in site.posts %}
        {
            "url" : "{{ post.url }}",
            "title" : "{{ post.title }}",
            "published" : "{{ post.date }}",
            "categories" : [{{ post.categories | sort | prepend }}],
            "tags" : {{ post.tags | sort | prepend }}
        }
        {% if site.posts.last.url != post.url %}
        ,
        {% endif %}
    {% endfor %}
]