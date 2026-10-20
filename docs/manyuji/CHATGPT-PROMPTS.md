# 만유지 ChatGPT 프롬프트

ChatGPT, 또는 다른 이미지 AI에 넣을 때 순서다.

1. 새 채팅을 연다.
2. 몸 정본 `references/front.jpg`, `references/side.jpg`, `references/back.jpg`와 얼굴 스타일 `references/face-set-cafe.jpg`, `references/face-style-garden.jpg`, `references/face-style-knit.jpg`, `references/face-style-pink.jpg`, `references/face-set-alley.jpg`, 코 옆선 `references/face-nose-side.jpg`, 환한 웃음 `references/face-smile.jpg`를 모두 올린다.
3. `references/face-front.jpg`, `references/face-side.jpg`, `references/face.jpg`, `references/cafe-white-approved.jpg`, `references/face-fit-front.jpg`, `references/face-fit-side.jpg`, `references/face-fit-source.jpg`, `standard-sheet.jpg`는 올리지 않는다. 그 얼굴은 이전 얼굴이다. `standard-sheet.jpg`는 몸매를 눈으로 확인할 때만 따로 본다. `references/face-set-bob.jpg`와 `references/face-set-bun.jpg`는 두상 폭이 필요할 때만 따로 본다.
4. 아래 마스터 프롬프트를 첫 메시지로 붙인다.
5. 그다음 컷 프롬프트 하나만 붙인다.
6. 얼굴이나 비율이 달라지면, 그 결과에 교정 프롬프트를 답장으로 붙인다. 새로 그리지 말고 틀린 부위를 문장으로 지정한다.

비율은 세로 3:4다.

## 마스터 프롬프트

```text
The attached photos are the locked canon for one fictional woman named 만유지. The user confirmed this appearance. It is absolute. Angle, pose, outfit, place, and expression may change. Her face may not. front.jpg, side.jpg, and back.jpg are the BODY only. Their faces are an older face. Ignore those faces. The face style is face-set-cafe.jpg, face-style-garden.jpg, face-style-knit.jpg, face-style-pink.jpg, and face-set-alley.jpg. face-nose-side.jpg is the nose line. face-smile.jpg is only the bright-smile expression of this same face, not a new face. Do not use face-front.jpg, face-side.jpg, face.jpg, cafe-white-approved.jpg, face-fit-front.jpg, face-fit-side.jpg, face-fit-source.jpg, or standard-sheet.jpg for the face. Those are older faces. Do not invent a new face for a new angle or a new pose. Do not average her into a generic pretty woman and do not return to the older narrower sleepy eyes, the fitting-room face, the raised studio nose, or the chestnut high ponytail. A new outfit or a new place is allowed. Her face, skull, and these body points are not. The face photos are not the bust reference. Keep the bust at a 70B that stays inside the shoulder width. Hair color in the style set is auburn, chestnut, or black. Follow the hairstyle named in the shot.

FACE AND NOSE. The five style photos set the face. face-nose-side.jpg is the nose line the user called beautiful. Keep that side line. The bridge is low, and the same line rounds into the tip with no corner and no separate cap. The tip sits only a little ahead of the upper lip. From the front, that same line is one narrow soft highlight down the center of the nose. Do not draw dark borders on both sides of the bridge. The shadow between the tip and the lip is short. Width equals the gap between the inner eye corners. Length is shorter than the middle third of the face. Small nostrils, short philtrum. The front nose and the side nose are the same nose.
Soft short face with full cheeks, low cheekbones, and a short round chin. Not a long narrow face. Thin dark brows, soft arch. Large round dark-brown eyes, thin soft double eyelids, large glossy irises, aegyo-sal, thin eyeliner. Do not narrow the eyes into a long almond and do not make them sleepy. Full glossy peach-to-coral lips, lower lip slightly fuller. At rest the mouth is closed or barely parted and no teeth show. A bright smile, only when the shot asks for one, matches face-smile.jpg: even upper teeth, lifted cheeks, eyes a little narrower from the smile but still large and round. The nose line stays face-nose-side.jpg while she smiles. Fair skin with window light or sunlight, so highlight and shadow stay on the face. Light blush, thin makeup. A small pearl stud may show. On a three-quarter view the iris stays visible.

SKULL, inferred from face-set-bob.jpg, face-set-bun.jpg, and face-set-alley.jpg. Use bob and bun for skull width only, not for the face.
There is no bare-head photo. The skull is a narrow egg, a little longer front to back than side to side. The crown is low and smoothly rounded, not flat and not peaked. One gentle arc runs from above the ear to the crown. The temples are narrow and do not bulge. The widest part of the skull is just above the ears and is only slightly wider than the cheekbones. The forehead is not wide. In profile the forehead slopes gently back from the brow. The occiput is low and short, rounding down into the neck. It is not cut flat and it does not project backward as a ball. A low bun sits at the base of that occiput, just above the neck. The face narrows from this skull toward the chin.

HAIR
Hair color and style follow the shot. The style photos use auburn, chestnut, and black, with a low ponytail, a half-up, or loose hair. If the shot names none, use auburn and keep the face visible. The skull shape stays the same under every hairstyle.

UPPER BODY, crown to underbust
Small head, about one eighth of her height. Long slim neck. Both collarbones visible. Narrow rounded shoulders, not broad, not square, no thick trapezius. Slim long arms, thin wrists, small hands. Bust is high, full, and rounded forward. From the front it stays inside the shoulder width. From the side it projects clearly from the ribcage. Under the bust the torso narrows at once.

MID BODY, underbust to hip
The waist is the narrowest part and the waist section is short. Stomach is flat and soft, not muscular. Navel is small. A cropped top shows one slim band of midriff, with the navel visible. Hip bones flare wider than the waist. On a high-rise jean the button sits just below the navel.

LOWER BODY, hip to feet
Upper thighs are soft and long, lightly touching at the top, then tapering. Thigh length is as long as the calf. Knees are small. Calves are slim and straight. Ankles are narrow and the ankle bone shows. Jean hems end at the ankle bone. Feet are small. Shoe soles are thin, so the leg line is not shortened.

SIDE SILHOUETTE, from side.jpg
The nose line is face-nose-side.jpg: a low bridge that rounds into the tip with no corner, the tip only a little ahead of the upper lip. Full glossy lips slightly ahead of a short round chin. Low rounded crown and a low short occiput. Bust forward, waist inward, hip and seat backward. The fullest point of the hip meets the top of the thigh. Legs stay long and mostly straight.

BACK SILHOUETTE, from back.jpg. This seat shape is locked.
Narrow back, shoulder blades not prominent. A strip of lower-back skin between the crop top and the jeans. The waist is the narrowest point, then the pelvis flares immediately to the left and right. The seat is round and divided into a left and a right side. The widest point is the back-pocket line. Below the seat the curve continues into the back of the thigh, with no horizontal gap. Do not raise two separate spheres, do not cut a shelf under the seat, and do not taper the seat to a narrow point. Keep this width. Do not enlarge it. Thighs continue long behind the seat. Knees stay close. Calves and ankles stay slim.

PROPORTION
Vertical 3:4. Head near the top edge, shoes near the bottom edge. Hip-to-floor is longer than shoulder-to-hip. The lower body is longer than the upper body. Shoulders narrow, bust forward, waist smallest, hips wider than the shoulders.

CLOTHING THAT SHOWS THESE POINTS
Fitted ribbed top. Square neck or wide scoop, open enough to show the inner collarbone and the upper bust. Hem above the navel. High-rise skinny jeans, button under the navel, hem at the ankle, fabric following the thigh and seat. Thin soles.

The twelve points that must survive every image:
1 soft short face, full cheeks, large round dark eyes, thin double eyelid, aegyo-sal, the nose line of face-nose-side.jpg, and from the front that line as one narrow soft highlight, full glossy peach-coral lips
2 narrow egg-shaped skull, low rounded crown, narrow temples, low short occiput. Hair color and style follow the shot
3 small head, long neck, narrow shoulders, visible collarbones
4 high forward bust inside the shoulder width
5 short narrow waist directly under the bust
6 flat soft stomach and small navel
7 hips wider than the waist
8 side view: bust forward, waist in, seat back
9 back view: narrow back, immediate hip flare, round seat widest at the back pockets and continuing into the thigh
10 long soft upper thighs, slim knees, slim calves, narrow ankles
11 hip-to-floor longer than shoulder-to-hip, jean hem at the ankle
12 fitted ribbed neckline and high-rise skinny jeans so those points stay visible

Photorealistic, sharp, and clean. best-standard.jpg is the sharpness reference only. Do not copy its face or its chestnut ponytail. One woman. No text, no logo, no watermark. Do not add grain or blur to fake a photograph. Keep this lock for the whole chat.
```

## 컷 프롬프트

마스터 프롬프트 다음에 하나만 보낸다.

### 앞

```text
Full-body front view, 3:4, same woman and the same twelve body points. She stands straight, arms relaxed, eyes toward the camera. Outfit: ivory ribbed short-sleeve square-neck crop top, hem above the navel, light-wash high-rise skinny jeans, white thin-soled sneakers. Plain bright room, pale wall, wood floor. Head near the top, shoes near the bottom.
```

### 옆

```text
Full-body three-quarter side view, 3:4. Read the side silhouette: bust forward, waist inward, seat backward, long thigh, slim calf, narrow ankle. One hand on the waist. Outfit: black ribbed sleeveless square-neck top, medium-blue high-rise skinny jeans, white thin-soled sneakers. Indoor concrete stair landing with a window.
```

### 뒤

```text
Full-body back view, 3:4. Narrow back, short waist, pelvis flaring just below the waist, round seat divided left and right, long thighs, close knees, slim calves. She walks away and turns her head enough to show a little of the cheek. Outfit: plain sage short-sleeve crop top with no mark, dark indigo high-rise skinny jeans, low ankle shoes with a thin sole. Quiet residential alley, afternoon light.
```

### 얼굴

```text
Waist-up portrait, 3:4. Match face-set-cafe.jpg and face-style-pink.jpg. Soft short face, full cheeks, large round dark-brown eyes, thin double eyelids, aegyo-sal. Match the nose line of face-nose-side.jpg. From the front that line is one narrow soft highlight down the center, rounding into a small tip, with no dark borders beside the bridge. Full glossy peach-coral lips, fair skin in window light. Auburn hair with loose strands around the face. Long neck, bust inside the shoulder width. Ivory collared knit. Warm window light.
```

### 환한 웃음

```text
Waist-up portrait, 3:4. Same locked face. Bright happy smile like face-smile.jpg. Even upper teeth, lifted cheeks, eyes a little narrower from the smile but still large and round. Nose line stays face-nose-side.jpg. Auburn hair, ivory collared knit, warm window light. Do not change her into a new person.
```

### 옷만 바꾸기

괄호만 바꾼다.

```text
Keep all twelve body points and the same face. Change only the clothes and the place. New top: [색] fitted ribbed [반팔/긴팔/민소매] [스퀘어넥/스쿱넥], hem above the navel, collarbone and upper bust visible. New bottom: [연청/중간 블루/진청] high-rise skinny jeans, hem at the ankle. Thin-soled shoes. Full body, 3:4. Place: [장소]. New pose. Head near the top, shoes near the bottom.
```

## 부위가 어긋났을 때

틀린 이미지에 답장으로 붙인다. 한 번에 한 부위만 고친다.

얼굴:

```text
Keep the body, pose, outfit, and frame. Replace only the face with the five style photos, and use the nose line in face-nose-side.jpg. From the front that same line is one narrow soft highlight down the center, rounding into a small tip. Keep the hairstyle of the shot. Do not narrow the eyes. Do not add dark borders beside the bridge.
```

다리:

```text
Keep the face and outfit. Lengthen the lower body. Hip-to-floor longer than shoulder-to-hip. Long upper thigh, slim knee, slim calf, narrow ankle, jean hem at the ankle bone, thin sole. Head near the top of the 3:4 frame, shoes near the bottom.
```

허리와 골반:

```text
Keep the face and the long legs. Make the waist the narrowest and shortest part, stomach flat, hips wider than the waist. From the side, bust forward, waist in, seat back, and the fullest point of the seat meets the upper thigh. From the back, the pelvis flares immediately under the waist. The seat is round and divided, widest at the back pockets, then continues into the thigh. Do not enlarge it, do not lift it into two spheres, do not add a gap under it, and do not taper it to a point.
```

가슴과 어깨:

```text
Keep the face and the legs. Narrow rounded shoulders, visible collarbones, bust high and rounded forward but still inside the shoulder width. The ribbed neckline shows the upper bust. The waist narrows directly under the bust.
```

눈:

```text
Keep everything else. Match the eyes to the user's front photos: large, round, dark brown, thin double eyelid, aegyo-sal, glossy iris. Do not narrow them.
```
