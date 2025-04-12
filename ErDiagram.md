```mermaid
erDiagram
    USER {
        PKEY id_user
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        VARCHAR(50) username
        VARCHAR(255) email
        CHAR(60) password_hashed
        TEXT profile_picture
        TEXT bio
    }

    USER ||--o{ NOTIFICATION : "primeste"
    NOTIFICATION {
        PKEY id_notification
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        VARCHAR(255) subject
        VARCHAR(255) body
        JSON payload
        BOOLEAN is_read
        FKEY id_user
    }
    
    ROLE {
        PKEY id_role
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        VARCHAR(50) denumire
        VARCHAR(255) descriere
        INT nivel_acces
    }

    USER ||--o{ USER_ROLE : "are"
    ROLE ||--o{ USER_ROLE : "are"
    USER_ROLE {
        PKEY id_user_role
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        FKEY id_user
        FKEY id_role
    }

    USER ||--o{ POST : "posteaza"
    POST {
        PKEY id_post
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        TEXT content
        TEXT image_url
        FKEY id_user
    }

    USER ||--o{ SAVED_POSTS :salveaza
    POST ||--o{ SAVED_POSTS :este_salvata
    SAVED_POSTS {
        PKEY id_saved_posts
        TIMESTAMPTZ saved_at
        FKEY id_post
        FKEY id_user
    }

    USER ||--o{ COMMENT : "comentează"
    POST ||--o{ COMMENT : "are"
    COMMENT {
        PKEY id_comment
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        TEXT content
        FKEY id_post
        FKEY id_user
    }

    USER ||--o{ LIKE : "dă"
    POST ||--o{ LIKE : "primește"
    LIKE {
        PKEY id_like
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        FKEY id_post
        FKEY id_user
    }

    GROUP ||--o{ GROUP_ROLE : "are"
    GROUP{
        PKEY id_group
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        STRING denumire
        STRING descriere
        INT numar_membrii
        TEXT imagine_grup
        BOOL is_public
        FKEY id_owner
    }

    GROUP_ROLE {
        PKEY id_group_role
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        STRING denumire
        STRING descriere
        FKEY id_group
    }

    GROUP_MEMBER ||--|| USER : "are"
    GROUP ||--|{ GROUP_MEMBER : "are"

    GROUP_MEMBER {
        PKEY id_group_member
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        FKEY id_user
        FKEY id_group
    }

    GROUP_MEMBER_ROLE o{--|| GROUP_MEMBER : "are"
    GROUP_MEMBER_ROLE ||--|| GROUP_ROLE : "are"
    GROUP_MEMBER_ROLE {
        PKEY id_group_member_role
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        FKEY id_group_role
        FKEY id_group_member
    }

    GROUP_POST {
        PKEY id_group_post
        TIMESTAMPTZ date_created
        TIMESTAMPTZ date_updated
        FKEY id_group
        FKEY id_post
    }

    GROUP ||--o{ GROUP_POST : "contine"
    POST ||--o{ GROUP_POST : "apartine"
```