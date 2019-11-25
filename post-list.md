---
layout: empty
---
[
    {% for post in site.posts %}
        {% raw  %} { {% endraw  %}
            "url" : "{{ post.url }}",
            "title" : "{{ post.title }}",
            "published" : "{{ post.date }}",
            "modified" : "{{ post.modified }}",
            "categories" : "{{ post.categories }}",
            "tags" : "{{ post.tags }}"
        {% raw  %} } {% endraw  %}
        {% if site.posts.last.url != post.url %}
        ,
        {% endif %}
    {% endfor %}
]