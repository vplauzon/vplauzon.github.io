---
layout: empty
---
[
    {% for post in site.posts %}
        {
            "url" : "{{ post.url }}",
            "title" : "{{ post.title }}",
            "published" : "{{ post.date }}",
            "categories" : "{{ post.categories }}",
            "tags" : [
                {{ post.tags | prepend: "12" }}
            ]
        }
        {% if site.posts.last.url != post.url %}
        ,
        {% endif %}
    {% endfor %}
]