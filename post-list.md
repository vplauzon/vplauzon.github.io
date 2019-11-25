---
layout: empty
---
[
    {% for post in site.posts %}
        {
            "url" : "{{ post.url }}",
            "title" : "{{ post.title }}",
            "published" : "{{ post.date }}",
            "categories" : {{ post.categories | sort  | prepend: "1" | remove_first:  "1" }},
            "tags" : {{ post.tags | sort | prepend: "1" | remove_first:  "1" }}
        }
        {% if site.posts.last.url != post.url %}
        ,
        {% endif %}
    {% endfor %}
]