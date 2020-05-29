// hard-coded bg tiles
const fgtw = new Image();
fgtw.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADRJREFUWIXtzjEBADAIxMCnKiqlK/5FFRksFwO5uq9/FjubcwAAAAAAAAAAAAAAAAAAgCQZQm4B0KN9/LwAAAAASUVORK5CYII=";
const fgte = new Image();
fgte.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADVJREFUWIXtzkEBADAIxLBjSuZf1gRgYcjgkxpoqt/9WexszgEAAAAAAAAAAAAAAAAAAJJkAF3RAy8pxiovAAAAAElFTkSuQmCC";

function tile(data) {
    let img = new Image();
    img.src = "data:image/png;base64," + data;
    return img;
}

let newtiles = {
    t: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAKRJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDRh1AtgOOnTI0HzAHwCzv6PyuRalDyHKAldn5kwwMDAwV5ZzXYGxyAYudoxUveVq/M+jqanJSYrmuriYnC/n1uSHD5cvXv1PSHmBgGAS5gIVcjVZm509CEqAhAyXpgGwHMDBAEuGQj4JRB4w6YNQBow4YdQAF7QEGqrQHAPQjLi4jhhqVAAAAAElFTkSuQmCC"),
    ot: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAN9JREFUWIVjTGrce4KBTKClJMh77d77z5ToZyJXM7XAqANGHTDqgFEHjDqAYgfURM41p0Q/C7mWtSxPPhlk3qOFLN6yPPkkzRxQEznXHNmCmsi55utOllwLMu/RIsdiuAO0lAR5iVWMrlZOgpcTmzixQE6Cl5NRQkCTqPbAsVOG5lZm508i8yvKOa91dH7XQhYnBdg5Wg18e4DoNGBldv7ksVOG5sh8O0crXmRxckKCpFyAywJyo4CBYTgURKMOGHXAqANGHTDkHcBi52hFVl3OwMDAoKuryUmJ5bq6mpwAme1AfjUsVnYAAAAASUVORK5CYII="),
    m: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAALFJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDRh0w9Bxw7JShOYzu6PyuBWPDxEkFLORoOnbK0NzK7PxJO0crXhgbWZwkB9g5WvGSZv13hopyzmt2jla8urqanAwM5xgQZnxnIMU8XV1NThbS63NDBnQ9CD6mHCEw9BLhgDsAPZEh80lNgGQ5gNpg1AGjDhh1wKgDRh1ARnsAASDtAfKBrq4mJwD18Tr59Wdv0QAAAABJRU5ErkJggg=="),
    ttls: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAANZJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDhocDjp0yNKe5A9AtocRSZMBCiuXolnZ0fteyMmM4iUs9AwMDg5XZeQx5kh1gZXb+5LFThubIhh07ZWheUc55DZvlhCxFcYCdoxUvcUq/M6Cq/c6gq6vJiSn3Hafj0IGuriYnC/H1uSEDqlpDhsuXr3+HiCHkYFECiwZCoUGzbEhsNBCVBmAAPX6xJUJSEiADAwMD42iTbNQBow4YdcCoA0a8A0hoD2ACRHuAfP0AiFxbnxcGQBkAAAAASUVORK5CYII="),
    ttl: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAANhJREFUWIVjTGrce4KBTKClJMjbkxv9mVz9do5WvEzkaqYWGHXAqANGHTDqgOHlgGOnDM1p7oCayLkolpBjKTJgIcdybI6wMjt/khwHkBQCLcuTT8LoluXJJ9edLLnGwMDAQK7lDAwMDCxaSoK8pGqC6ZGT4OVkYIBUqxCZ70hswkBXV5OT5dq99yTV50HmDAzIekzkGRgO7T8G5RsisYkDQzMbUjMnkJQLGBgQCREGkBMgOYlxaEbBqANGHTDqgFEHDCsHkNUegAE5CV5OO0crsi3X1dXkBAAsPT3BhmryxwAAAABJRU5ErkJggg=="),
    ttle: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAQBJREFUWIVjTGrce4KBTKClJMjbkxv9mVz9do5WvEzkaqYWGHXAqANGHTDqgOHhgGOnDM1p7oCayLnm+PjkAhZSLEe3NMi8R6uHgeEkunrkELEyO48hT7IDWpYnn6yJnGvesjwZblhN5FzzdSdLrjEwRGNYjmwpOh/DAVpKgrzEOIKBAVL9IvPlJHg57RytGBgYvjPYOVpB5b5jpAmEHCrQ1dXkZLl27z1R9XmQOQMDstogcwaGRy8+fz+0/9hnBgZDBgjNwMDAYEgw2JHB0MqG2BIhuhors/Mnj50yNEfG+MxkHG2SjTpg1AGjDhh1wIh3AEntAXSAaA+QB3R1NTkB3PlZxXK1Q/IAAAAASUVORK5CYII="),
    ottls: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAPlJREFUWIVjTGrce4KBTKClJMh77d77z5ToZyJXM7XAqANGHTDqgFEHDC8H1ETONae5A9AtIcdSZMBCrGUty5NPwvjYHNGyPPkkIf0kOQDdUBgfWVxLSZA3yLxHC5fluCxFcYCWkiAvLkl0ORgfRstJ8HKiq0Nm10TONV93suQaLvPlJHg5GSUENLG2B46dMjS3Mjt/Ep2PLG7naMXb0fldC8ZH1wMTY2BgYEAXh+mneTbEZjEywJkGYL7FZhCu0EHWj0svOsAZBcQAO0cr3kP7j5HdJKNLFBACow4YdcCoA0YdMOoAFjtHK5ztAUJAV1eTkxLLdXU1OQGVEG2RAJhf4QAAAABJRU5ErkJggg=="),
    ottl: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAVNJREFUWIW9liFvwzAQRr9OIQEGYUUFYbNUbKmgUv+CWelKBwdLJhVGGiosKigLLBtfCspaODA0NlAwOnSSFyWxfbX9SQFW7vyeZFm+Ee5ItT9frp8/N26/LAvxwG1+en3/4PaaYQmEgrMEQsK9BULDvQRiwJ0FYsGdBGLCrQKx4YMCKeC9AqngnQIh4OvlTrEEfOBtiA/UTOYCNzffHFYNrbWqpFb/6zaHVeMtYIObm9J6vdypunm50mvIgQNAVu3PF1uRLAvRtZ6MRd5X1+7pymQs8sz2nmsFmDW01gr4+r790j+zrt0zFPY8ECKnemsXoPOmzzxnrSpp1vrchOPbMwBgdM+9l2UhOCMZweeLGX8k44bglKQCbXhSgS54MoE+eBKBIXh0ARs8qoALPJqAKzyKgA88uIAvPKgABw4Amcu73ReaB071FvPFzLt/On3M/wCM6p3/oUulqQAAAABJRU5ErkJggg=="),
    l: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAItJREFUWIVjTGrce4KBTKClJMjbkxv9mVz9do5WvEzkaqYWGHXAqANGHTDqgKHtgCDzHq0BdQA1wKgDWLSUBHkpMcDO0Yps/bq6mpws1+69J7s+DzJnYDi0/xjZ+hkYBkEUDG0HrDtZcm1AHUANMOqAUQeMOmDUAaMOoKg9ICfBy2nnaEW25bq6mpwAKsMVNWaSSEEAAAAASUVORK5CYII="),
    ltts: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAShJREFUWIXtliGPwjAUx/+QmYkm4E7jRjJRsyUVS/Y5cOg7fVg8CYqvgcQREkRzq8HxRSawiMtuN2Bd97qi+pKl2Utff7/tbWlHy/XxB8SYz6Zs87UoqfVZLtiYWgwAar+zKQcAkAUO209rOFlgKDhJYEh4b4Gh4b0EXMCNBVzBjQRcwjsFXMO1Au+Atwq0waXiqXMBkyd/FLERC6jw3/EGgP/lRXIpXkn9z7cKmPZcJJeigmW5YOeTLF/BddCGwHw2ZWq/Q5YLg+k3ZLlg1RjHUdjM1/Ok4unqO7zqVovjKAz67ecc55Ms6xFP9wAgEhRA3Qbd27A6D3SFSRvIAro/QSqeVleXxOhjEpGPZNVHaFPvtAUm4QW8gBfwAl4gaO7j/aI+D9Dr77ZTfBbRwfiXAAAAAElFTkSuQmCC"),
    ltt: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAALJJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDhp4Djp0yNB9QB+ByCLkOYyS1MiJkkZXZ+ZPEmkV2ZQSzpKKc85qV2fmTMD4plsMAi52jFS9pWr4zQPR8Z9DV1eTEFCce6OpqcrKQXp8bMkD0GDJcvnz9O0I/TJw0MPSyITLo6PyuhcwnJyeQnAuQwWiTbNQBow4YdcCoA4aFA8hoDyAAanuAPP0AOFw+/dnAnH4AAAAASUVORK5CYII="),
    ltte: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAMNJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDhoYDjp0yNB9QB+BySEfndy1KHcBITGVEKASszM6fxKYWWRwbsHO04mUhxpUww46dMjRHt4wUPjbAYudoxUvY+u8MEHUwGl0cwUcPLXzm6+pqcrIQV58bMkDUwWh0cQSfkI/RwdDIhsgAPYjRE92xU4bmyJiQeUTlAlxgtEk26oBRB4w6YNQBw8IBRLYHsANdXU1OSizX1dXkBAC+51e1kurJqgAAAABJRU5ErkJggg=="),
    oltt: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAPVJREFUWIXtljEKgzAUhl+KSweHbp06ODgUvECOoltv0gN4AlfxFh1burkr6FH+TgErTTSJiRTyg4jGl+8zJkQiiwDgtvUHmw62SBAIAkEgCPynwNDl2FVgmrmMrlykA0jShk3bxr54yiTmzxpF9nbiDIDbjAAAHqm21LEvvrZccT25n4mOZDULyZStPkZg12VY1m2lFEjShg1dDnHIJpbJKNzujzcRkdVMBcAZYy/dOgG/JqfY+ycQcBGvAnO4V4FfcG8CMrgXARXcucAS3KnAGrgzgbVwJwI68M0FdOGbCpjAiYiU/wMrkgGgsm4rk+LLOT5+AHSuphLEKa96AAAAAElFTkSuQmCC"),
    oltte: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAPpJREFUWIVjTGrce4KBTKClJMh77d77z5ToZyJXM7XAqANGHTDqgFEHDC0H1ETONR9QByADdMeQ6zgWYixoWZ58EptckHmPVpA5qjhMLT79BB2AbBA2fsvy5JM1kXPN150suQarDdEtx6cfxQFaSoK82CTQxWF8ZHE5CV5OXHrQowSbPXISvJyMEgKaGO2BY6cMza3Mzp9E5yOLHztlaF5Rznnt0P5jn9H1oOvHBewcrQa+PYA1DcB8i8zHpq6j87uWlRkDRkih68dnBtYoIBbYOVrxwqKAXP0DHgWjDhh1wKgDRh0w6gAWO0crrO0BYoCuriYnYVX49QMA2hl2sYo6n8oAAAAASUVORK5CYII="),
    ltbs: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAYRJREFUWIVjTGrce4KBTKClJMjbkxv9mVz9do5WvEzkaoYBr8IpFOmn2AGUOoIqDqDEEVRzALmOoKoDyHEE1R1AqiNo4gBSHEEzBxDrCJo6gBhH0NwBhBxB0AE1kXPNSREn1RFEhwCpFhLrCEZClRE2i1uWJ59EF29ZnnwSlz50uW39OQwMDJDKiIUYl8MsRDdo3cmSa9fuvf8MsxAmj00tMvAqnAJ3BIuWkiAvIQfA1KCrlZPg5cSmDuaIdSdLruE0c/JShu+393GywHyACwSZMzBcu/f+M4xGFn/04vN3mBiy/LV7sJDoMWdgwIwCuCNUnRiYnlz5hM9+igC+aIABFgYGBoYnVz4xyOjwETQMlrBgBgeZ92jBfItsGb4EiA4Y3ULXw3MBIUegAy0lQV5CUUhIP0o5QMvowAUwCiJ6OwJrSUhPR+AsiunlCLx1AT0cQbAyorUjiKoNaekIoqtjWjmCpBYRLRxBcpOM2o4gq01ITUewGOmJEmwP4ALo7QFy9AMAk8+q6pzb1d4AAAAASUVORK5CYII="),
    ltb: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAATRJREFUWIVjdAtdf4KBTGCkJ8q7c+f2z+TqtzBV5mUiVzO1wKgDRh0w6oBRBwwtB8xoXW2OTXztvPtYxanuAEIOIQewkGs5jN65U/EkAwNqKAQnQcRo4oCM6tCTM1pXm2dUh5400hPlZWDYjmHp2nn3zYl1BAvEEOIBTL2RniivsoIAp4WpMgMDw30GC1NlJHPQ+diBuqoUJ8u5S6+Jr8/DGRjOXXr9GU4zMDCcOH33M0MmlIYBdD4ewLRrdaAF0Q6gAWBhYGBg2LU60IKUlhEsHTAwUJ4IGZE5pDbPqN4kG4jowCiI6O0IrCUhPR2BsyimlyPw1gX0cATByojWjiCqNqSlI4iujmnlCJLaA7RwBMkNEmo7gqwWETUdwfj//38rcjXPWXJ1yblzp76Tq19dVYoTAH8EdbCda/j+AAAAAElFTkSuQmCC"),
    ltbe: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAOJJREFUWIVjNLSpPsFAJrAwVeY9cfruZ0r0M5GrmVpg1AGjDhh1wKgDBr8D1s67b06KONUdQG0L0QELKZbD6OAkxZMMDAwMpZl7tBgyIWpgYuh6sMmR7IDgJMWTa+fdN0c3qHu6yzVYbYgsj64Wm164AyxMlXnxW3+fAaIGRiPE1VWlODHVQdjoUYbNHnVVKU4WgvV5JgPDidN3P8NpJPGbt599h4shy2diC/a7WI0f8GxIVBpgYECkAxibgQF3IkRWiyyGzVzG0SbZqANGHTDqgFEHjHgHENEewA1Q2wPk6QcAothtrPV/9SsAAAAASUVORK5CYII="),
    ltbi: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAQ1JREFUWIXtlrEKwjAURa/SJWDAbJ0csrVQsIuFDoKfoaP+gqOL4G90dvMPRHAotoPdOvoLDg5dHfRJVdCmCiK8u4SXNPeeQEJfw247O9RUfxDK7SY+fbK/WXfzt8QADMAADPA/AHHqBybz79aMAUxMSWEvS74KQOFx6gdlEKof4arAWiYAYS9L4tQP6GT9QShpvhxa5eQ3ADJ5r+IaWNyCPc8RwB73HkWpLvDK3/McYbW6o4r/8wiXb2kEhFYA9rj3iEp1hFf+QqvfP0OjOwAAi+UkmQ2jAABWyTQHAKpp3cSvMZ6va7dkrlYyPxxrt2SuVtySMQADMAAD/B7AcrWq2A88q2NL8Ul4x5biDKKQVJkxP91OAAAAAElFTkSuQmCC"),
    b: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAKZJREFUWIVjNLSpPsFAJrAwVeY9cfruZ0r0M5GrmVpg1AGjDhh1wKgDhq4D1s67bz6gDqAWYKFEc2nmHi2GTAg7OEnxJN0d0D3d5RqsNlw77745OY5gsTBV5iXP+vsM6qpSnMh8Us1SV5XiZCG7Ps9kYLh5+9l3uP5MBgZyzBpNhGQ7IDhJ8SSlTTIGhkEQBaMOGHXAqANGHTDqAAraAwxo7QHy9AMAM1Azr5iMsDUAAAAASUVORK5CYII="),
    bi: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAO9JREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDhqYDjp0yNCdFnOoOwAWszM6fJFUPC7mWQXz7nYGBwRBu8bFThuakOoLsELAyO3+yopzzmpXZ+ZPkBD0MsNg5WvGSru07g52jFa+uriYnMh9BEwd0dTU5WXgMosioz+cy8BhEfeZUEmTgYTb8DOMjaOIAp5LgwGdDshNhTeRccwYGBoYgcwaGluXJJKd+GGBMatxLdpNMS0mQ99q992Q3ybSUBEebZKMOGHXAqANGHTDwDmDRUhIkoz0AAXISvJyUWC4nwcsJAD0XOjay6+uEAAAAAElFTkSuQmCC"),
    btls: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAVpJREFUWIVjNLSpPsFAJrAwVea9+0Tws4wOH1n6tZQEeZnItRwZPLnyiWy9VHEAJY6gmgPIdQRVHUCOI6juAFIdQRMHkOIImjmAWEfQ1AHEOILmDiDkCLo4AJ8jCDpg7bz75sRYMKN1NUF12BxBdggQ6zBCjmAh1bLgJMWTMH5p5h4tBgYGhozq0JPoepBDBF3+yZVPDLAKjCgHBCcpwg1YO+++OcwR3dNdrt19IvgZm+XYHIXuCC0lQQYWC1NlXvzW32dAVQPj32dQV5Xi5BfigcsY6YnC1c1oXW0+a2XWNXwm8zOwcbKcOH0XwwcoIJOBAUUNjJ/JwHDz9rPv8BAIZ2A4d+n1ZwYGBoaMSxDfz2idZs7AgD2KYICm2ZBQNDAwkJkIYfTaeXuw+hBfAkQHjNRokpGr30hPlDpNMkrAqANGHTDqgFEHjDqAiPYAboDeHiAVKCsIcAIAe5CPELOwgKoAAAAASUVORK5CYII="),
    btl: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAOxJREFUWIVjTGrce4KBTKClJMjbkxv9mVz9do5WvEzkaqYWGHXAqANGHTDqgKHlgJrIuebEqDt2ypAodSQ7gBoWogMWUjUgh8K6kyXXYJbDaCuz8ydp6oCW5clwC2oie8ytzM6fPHbK0JxUi+EO0FIS5CVFA7p6O0crXgaG71AaBtD52IGuriYny7V774muz4PMGRiQ1QeZMzAc2n/sMwODIZSGAXQ+bjDg2ZDiRMjAEM0ASwcMDDROhMgJkIGBgUFLiQEez8gWk+KIAY+CUQeMOmDUAaMOGHUAye0BZCAnwctp52hFtuW6upqcAMjRS5VZKuKUAAAAAElFTkSuQmCC"),
    btle: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAQRJREFUWIVjTGrce4KBTKClJMjbkxv9mVz9do5WvEzkaqYWGHXAqANGHTDqgMHvgJrIuebEGHTslCFR6kh2AC5ArMMIARZSLWtZnnwSxg8y79EKOmXIYGV2/iS6HuQQwSZPkgNalifDDaiJnGsOc8S6kyXXsNWGx04ZmiNbis7HcICWkiAvPgegy8P4chK8nHaOVlDR7wx2jla8MDZ6mkDIIYCuriYnCwMDA8O1e+9x1ulB5qjyMH6QOQPDoxefvx/afwwqZ8iAzMYX7MhgwLMhWYkQRtdE9phjS4RWZudPokcBrhBhHG2SjTpg1AGjDhh1wIh3AFHtAVwAtT1AOtDV1eQEAJZ/aQ+9BuV0AAAAAElFTkSuQmCC"),
    btli: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAARZJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDhoYDjp0yNCdVHbF6KAqBjs7vWrjkrMzOn6SqA46dMjSHYRgfWRybemLMZSHWAcg+OnbK0NzK7PxJGE2sGVgdYOdoxUtY2XcGVHUwPi5xbHowga6uJicLcfW5IQOqOhgflzg2PdgBk1fhFML20xCwMDAwMHgVTmHY1p+DVyFyooLFe0U55zWYOLlpgTGpcS+8SUbIEeiA6k2ygYgOjHKA3o7AWhDR0xE4S0J6OQJvUUwPRxCsC2jtCKIqI1o6gujakFaOIKk9QAtHkNwgobYjyGoRUdMRLFpKgkS0BzCB1uSlDN9v7+OkxHJdXU1OAGRvcMDri+iJAAAAAElFTkSuQmCC"),
    obtl: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAQFJREFUWIVjZKAA/P//38o9bEMfufqN9ER5mShxAAMDA8Ou1YEWlOin2AGUOoIqDqDEEVRzALmOoKoDyHEE1R1AqiNo4gBSHEEzBxDrCJo6gBhH0NwBhBxBtgPu3Yr6T4o6XI6gegjgcxg2RzCSaqiS2jJGbBYpqS1jxCUG0wMDbqHrTzAwQCojkixH5t+7FfX/////VtjE8elHdkRF85GrLMiGYAP3b0czIKuB8e/fjmZgYGDQ/f//P4Y4NvVYjC6as+TqEnx2Y/UBtUKAgQHSnqBLNsQHqJoI0dXjSoQwQCj6CQJKDRgUUTDqgFEHjDpg1AGjDiDYHiAA4O0BcvUDAL6AsiafmWsiAAAAAElFTkSuQmCC"),
    btrs: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAANZJREFUWIVjNLSpPsFAJrAwVeY9cfruZ0r0M5GrmVpg1AGjDhh1wKgDBr8D1s67bz6gDsAFqOUwFlItC05SPAnjl2bu0WLIRBWDqcGmj2wHIGteO+++OczC7uku15BrQ2zqCJnNwsAAqRZxK7mPJg/j32dQV5XixKcO5khcJqurSnGyMDAwMOCt0zPR5GH8TAaGm7effYfLoakLPg2Lhj3mDAy4o4Dm2ZBQNJCVCGH02nl7zGGJkBg92ADjaJNs1AGjDhh1wKgDRrwDWPC3BfAD1PYAefoBLj1wZLTLUBIAAAAASUVORK5CYII="),
    btr: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAS5JREFUWIVjNLSpPsFAJrAwVebdvWfvZ3L1W1vq8DKRq5laYNQBow4YdcCoA4aGA9bOu28+oA7ABUoz92hR6gAWYhUih0JwkuJJGH/X2v/mDAwMDG7BjCdhbBifqg4ITlKEG7h23n1zmCPQLSLWYrgDLEyVeQkru8+Aqg7Gv89gbamDJH4ZjY8faGkocLKcOH2XcH2eycCAog7Gz2RgOHr8Cop+dD4hMKDZcMHMilSyEyEDAwND93SXa7vW7oEnQlIsv3N5qQUDwxIrohyAnADRAbLFxDoCYjkE0D0KkC2nuwPQLaerA7BZTjcH4LKcLg7AZznNHUDIcpo6gBjLaeYAYi2niQNIsZzqDiDVcqo6gBzLGRiIbg9gB+qqUpzfvuowLJhZkcrAsMSKDCN0AUQSdZPK6f1GAAAAAElFTkSuQmCC"),
    btre: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAWFJREFUWIW9lqFuwzAQhv9OIQGWFhYUTUFbVB5VfYPBsdL1CSYVlkzqG3S0Y1XJXqBgZCUrrhSYVwjYCwxM1q6J7dgn20eis335PsuWzpP89uEbzFht96Jpux9ufVVm4oZb/Pjyxi29CpaALzhLwCfcWcA33EkgBNxaIBTcSiAkfFQgNNwoEAOuFYgFVwpQ+Hqxq6MK2O7cp1gyBqewzWF5lrn8Nu3/mFyjqjMKmHZOi9eLXS0lNofluSozAXTadbr8SmC13QstHX8tU5VXZSaKXKS6df1j6s8DQJGLNDH186caoPMyp+P9XK4b7rgb/P9yOvLasY/4+ngHQC6hLlSXiV7Gph2eLZ3v11I4AEyeXz/ZT7KqzJyfZBQ+n035TzJOULiMaAIqeDQBHTyKgAkeXGAMHlTABh5MwBYeRMAF7l3AFe5VgAP3JsCFA0Ci6tO2UeQivZyOmM+mrPrq/i79BTkPoeAZKQGiAAAAAElFTkSuQmCC"),
    btri: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAPpJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDBr8Djp0yNCfHYGL1kR0ChCywMjt/khhzGAlVRugWWZmdP0lIDMYn5Ag7RyteFmJciWwQzOBjpwzNK8o5ryHXhsT6GhmwwFyCW8l3NHkY/zuDrq4mJ2F1uIGuriYni1fhFAYGBgY8dfpcBh6DqM+Y/LkMnKpO33mYDT/jV4cbcCoJDnw2JCoN1ETOhSewluXJJ2F0TWSPeZA5QowcwJjUuJfsJpmWkiDvtXvvyW6SaSkJjjbJRh0w6oBRB4w6YOAdwMLAACmTydEsJ8HLSVgVfv0AIi1Zv1d12AkAAAAASUVORK5CYII="),
    r: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAKdJREFUWIVjlBDQPMFAJrBztOLlMYj6TK5+LSVBXiZyNVMLjDpg1AGjDhh1wKgDBtwBLORqPHbK0JyB4TsDA8NchpblySfp7gAGBgaGinLOa5TUhgwMDAwsdo5WvORp/c6gq6vJyakkSLblchK8nCyH9h8j0weGDJcvX//Ow2xIUQgMeCIcug6wMjtPdsqnigOoBUYdMOqAUQeMOmDUARS0Bxio0h4AAFaLHBtyMt+gAAAAAElFTkSuQmCC"),
    rtbs: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAQRJREFUWIVjlBDQPMFAJrBztOLlMYj6TK5+LSVBXiZyNVMLjDpg1AGjDhh1wNB2QEfndy26OuDYKUNzSi1EB4z4KiN8FlqZnT+JLt+yPPkkjF0TOdccmzgy0FIS5GUh5EIrs/NwzcdOGZoj87FZ2rI8+SSMJmQ2AwMDA4udoxUvbunvDKjymHwtJUEU/TB+TeRc83UnS67hs1xOgpeT5dD+Y3jqc0MGVHlM/rV77+H8IHMGhmv33n++dg/i+5rIHnMGBtxRwMBA42xITDQQTAPIADnhwdICtsRGTAKEAby5gBAYbZKNOmDUAaMOGHXAsHAAgfYAfqCrq8nJqSRItuVyErycACx7YAZe4QQBAAAAAElFTkSuQmCC"),
    rtb: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAOJJREFUWIVjlBDQPMFAJrBztOLlMYj6TK5+LSVBXiZyNVMLjDpg1AGjDhh1wPBwQE3kXHO6OuDYKUOyLUQHLORaCBH7ztCynOEkAwNqKLQsTz5JVQcwMDAwWJmdhxt67JShuZXZ+ZOQ2hDT0prIuebEOoLFztGKl7Cy7wyo6iB8XV1NTk4lQQYGBkjViqwDnY8NyEnwcrIc2n+MiPrckAFVHYLPw2z4OcicgeHavfdweXQ+PjDg2ZDoNIAMrMzOn6RWImQcbZKNOmDUAaMOGHXAiHcAke0B7AC5PUAOkJPg5QQAJ/ZKOm0mRbEAAAAASUVORK5CYII="),
    rtbe: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAS1JREFUWIVjTGrce4KBTPD36SneS9e+fCZXv4WpMi8TuZoPrZlHrlYUQJYDqGU5WQ6gpuUkO4DalpPkAFpYTrQDaGU5UQ6gpeUEHUBry/E6gB6W43QAvSzH6gBSLK8vuaxFVQcQsnzX2v/mlFqIDljwWY7NQpiYWzDjSQYGBoa18+7D1QQnKZ6EsXGJY3UAPp/DLIJZjszHZmlwkuJJGI0ujtUBf5+e4rW21MFh/WUGa0sdXnx8C1NlJP59KP8+SggwMDCgqYMAdVUpTpajx6/grc/R5dH5J07fRfAzofxMbMF+F6v5ZLcHqAVYCCtBALdgxpPEJEJYOkDWiysNMKroRpPdJLO21Bm4Jhm1wKgDRh0w6oBRB4w6gAW1ficNaGkocHJxfyfbcnVVKU4AnZ+F/AJXNqYAAAAASUVORK5CYII="),
    rtbi: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAQFJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDhr4Djp0yNCdFnGIHEGuwldn5k8SoYyHHQphYRTnDNXQ1MIuPnTI0J8YRBB2AbCi6wXaOVrz45IkBLDBDcIPvDKhqEHxdXU1OBoZzOOTR9WECXV1NThbC9bkhA6oadD4DDnlMddjAgGZDs6Bs4tIAMrAyO3+SmERICHgVTmFgYGBgYByIJhnMci0lQfo3yWCWwwBdHYBuOV0dgM1yujkAl+V0cQA+y2nuAEKW09QBxFhOMwcQazlNHECK5VR3AKmWU9UB5FjOwEBUewA3gLQHILUaOUBOgpcTACuAavrR/QX1AAAAAElFTkSuQmCC"),
    ortb: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAP1JREFUWIXtlrEOgjAQQK+GlZ8ghEW6S/kTmf0BJ/0UnTRRvoVZNzX+yjk1aS60wJXi0ksIOXrX90Ibishl0wEz6qpMr+fjmtuPiGrFbQYAuJwOO59+AAC2wOd53/jC2QJzwVkCc8InC8wNnyQQAj5aIBR8lEBI+KBAaLhTYAm4VcAX/n1tkS3AgU8B0hDmYdQHNyfPilYMAbOiFXRc99FARAW5bDrbiUgn0rm+I6Jy1dlyU2BVV2X6ftz2iKjopYtobtylq86WG89ln9iyb8BpsEAkrkG6oWybyazr26i2Pu/QS+DT//cliAJRIApEgSiQeH7PJSL7bwwAQP4ArdfY1Y1QUM8AAAAASUVORK5CYII="),
    rtts: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAPlJREFUWIVjlBDQPMFAJrBztOLlMYj6TK5+LSVBXiZyNVMLjDpg1AGjDhh1wKgDSHbAsVOG5sj8msi55rjUEgMYCVVG6BbiAi3Lk0+iOwgmhgtoKQnyshBjuJXZebhBx04ZmsP4do5WvB2d37WQLSdkKTpgsXO04sWv5DsDqhoEX1dXk5OB4RyDlpIgXL4mcq75upMl14ixXE6Cl5Pl0P5jBOpzQwZUNeh8BoZr995/htCwkOgxZ2AgHAUMDDTKBaREA1FpAB0gpwMGBkTck5IAYYBgLsAHRptkow4YdcCoA0YdMCwcQER7ADfQ1dXk5FQSJNtyOQleTgBjPlQW1sObEwAAAABJRU5ErkJggg=="),
    rtt: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAANFJREFUWIVjlBDQPMFAJrBztOLlMYj6TK5+LSVBXiZyNVMLjDpg1AGjDhh1wKgDKHJAR+d3LWR+TeRcc1LNYCSlMjp2ypAoC1qWJ58kRp2WkiAvC7GWw4CV2Xm44cdOGZojW1YTOdecWMthgMXO0YqXeOXfGVDVf2fQUhJE0Y/OxwfkJHg5WQ7tP0ZCfW7IgKrekOHavfdwfpA5AwqfGDC0cwEDA2bKJzUnkJQL0MFok2zUAaMOGHXAqAOGhQNIbA+gAl1dTU5OJUGyLZeT4OUEAEsxND/sAyuHAAAAAElFTkSuQmCC"),
    rtte: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAMdJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDRh1AlgOOnTI0x8cnBTASUxkRa4GV2fmT6OphYtiAnaMVLwsxBqMbdOyUobmV2fmTsNoQxkeWQ1eLy1wWO0crXsLWf2dAVQfh6+pqcmLKf8cIMVx26OpqcrIQV58bMqCqQ/AhNLK8Id5gRwdDMxcwMODOCVZm508eO2VojozxmUNULsAFRptkow4YdcCoA0YdMCwcQGR7ADtAtAfI1w8ApyVdSRELcJkAAAAASUVORK5CYII="),
    ortt: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAW1JREFUWIVjTGrce4KBTKClJMhbEmukTa7+////WzGRqxkGKPEAAwMDA8UOoNQRVHEAJY6gmgPIdQRVHUCOI6juAFIdQRMHkOIImjmAWEfQ1AHEOILmDiDkCLo4AJ8jqOKAmsi55vj4+BzBSCiOkA1rWZ58Ep8F6ACmHh3Mq3e2YGCAVEYshCxHNgSZ37I8+aSWkiDvtXvvP+NThw0kNe49AXMEi5aSIC8+R6DLw/haSoK8chK8nITU4QI9i89dZWBgmMRy7d77z7gUBZkzMCDLw/jI4uh8bPpwgd4l5/OYtvXnEFJHU8DEwMDAgMsRLcuTT9ZEzjWHYXzxSmxOQAeMEgKa8FzgVTiFKFfDACwRkqQJTT9KOTAQ0YFRENHbEVhLQno6AmdRTC9H4K0L6OEIgpURrR1BVG1IS0cQXR3TyhEktQdo4QiSGyTUdgRZLSJqOoLFztEKb72NC3y5sIxBzqqCk7BK3EBOgpcTABfJo70iscJbAAAAAElFTkSuQmCC"),
    ortte: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAOdJREFUWIVjTGrce4KBTKClJMh77d77z5ToZyJXM7XAqANGHTDqgFEHjDqAbAfURM41x8cnFjBiq4yQDWtZnnySFAtg6nGZgwy0lAR5WbBZjm4IjI8uvu5kyTVYbYhPHzY+DLBoKQnyYnMZNj66uJwELyc+feihhk0/o4SAJkoUHDtlaG5ldv4kOh+beEU557VD+499xqcP3XPIwM7RauDbAxhpAOZbZD4uzR2d37WszBiw+hrdHFxmYUQBKcDO0YoXFgXk6h/wKBh1wKgDRh0w6oBRB7DYOVphtAeIBbq6mpyEVeHXDwCAnnRm12icbgAAAABJRU5ErkJggg=="),
    ttrs: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAANtJREFUWIVjlBDQPMFAJrBztOI9tP/YZ0r0M5GrmVpg1AGjDhh1wKgDRh1AlAOOnTI0x8enBDASqozwWVZRznmto/O7FoxvZXb+JLoemBg2YOdoxctCyIVWZudPHjtlaI5sEIxv52jFi24JulpCgAVmCH7wnQFVHYSvq6vJycBwDkPu2ClD84pyzmuETNXV1eRkIa4+N2RAVYfKR2ZbmTGgRAOh0KBZLiA2Goh2ALE54dgpQ3MYJsYRBHMBPjDaJBt1wKgDRh0w6oBh4QAi2wPYAaQ9QD7Q1dXkBADkWFyb0p5taQAAAABJRU5ErkJggg=="),
    ttr: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAMNJREFUWIXtljEKwzAMRX+KFw+Gjr2CCxqypODB4Nu1pyp0CE2H5jAdsnYowSaBJHKypOhvxnz9B5aRitPRPpEpH5x53OvPGv8h17yVBEAABEAABIANUL/Ky9SZq4IzjKbCXNU26b2r2maung/OqKXhaUhf3AdnrrfunIYtCU6lfHCGYwA69B4iq4E3Yo0OnHpEViv+PC8x9MTz+G5O+/sFwLY/gdWEwLjJ1jQgsNcnEAABEAAB+CuAjH0g6rcP5IvI6i9JQEEjDdt0xAAAAABJRU5ErkJggg=="),
    ttre: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAARpJREFUWIVjlBDQPMFAJrBztOLlMYj6TK5+LSVBXiZyNcPAtv4civRT7ABKHUEVB1DiCKo5gFxHUNUB5DiC6g4g1RE0cQApjqCZA4h1BE0dQIwjaO4AQo6giwPwOYIoBxw7ZWiOj0+JIxgJVUb4LKso57zW0fldC8a3Mjt/El0PTAwZeBVOYWBgILIyghlgZXb+JAyjG4wsfuyUoTmyWmweQA4JFjtHK15CjmBg+M6Aqg7C19XV5GRgOIchh24pNju+XFjGIGdVwclyaP8xIupzQwZUdah8dDlswY4ddNAvF+ACRDuA2JwAi3dkjM9cgrkAH7BztOIlLgpx6x86UTDqgFEHjDpg1AHD1gFEtgewA0h7gHygq6vJCQD0c3gN/1qsDQAAAABJRU5ErkJggg=="),
    ottr: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAPpJREFUWIVjYKAA/P//34pS/UyUGEANMOqAUQeMOmDUAaMOIMsB925F/cfHJwUwkmKZktoyRnyWocsrqS3Daz7BygyXT2E0zABkdaSExv///61Y8Lni/u1oFFfC+Ejiuv///0dRh66HANDFK0uPEGBKatx7glgNtABMDAwMDLgcAUtUMIycqKiVExiRLZ9X72xBiub///9bMTIyHiPHYph+lHJgIKIDoyCityOwloT0dATOophejsBbF9DDEQQrI1o7gqjakJaOILo6ppUjSGoP0MIRJDdIqO0IslpE1HQEi5aSIC85GnsWn7vKwMAw6f9/sltjDAwMDLoA8vOrPn/MZ+sAAAAASUVORK5CYII="),
    ottrs: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAPFJREFUWIVjTGrce4KBTKClJMh77d77z5ToZyJXM7XAqANGHTDqgFEHjDqAJAfURM41R+YHmfdoUeoARlyVEbJlLcuTT6JbjgzQ5VuWJ5/EZQ6yPi0lQV4WXJajGwKzBJs4LgvQ5bEBFi0lQV5sEujiMD4ucWxyMEesO1lyDZsdchK8nIwSApoYUXDslKG5ldn5k+h8XOLY9KCbx8DAwIAub+doRZ/2AC6HMTAwMGBNAzDfYjMAXyigA1xmIAOsUUAssHO04j20/xjZTTK6RQE+MOqAUQeMOmDUAaMOYLFztMLaHiAG6OpqclJiua6uJicAAvNwBtqn1JkAAAAASUVORK5CYII="),
};

// hard-coded wall tiles
let tiles = {
    b: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEBJREFUWIXt0EERACEQA8FwhQAkoOck8EcMqkHGfjoGpivtP+umcF9lHAAAAAAAACBJ+tyjFFD+AAAAAAAAAMAD1fcDA0b3Q3IAAAAASUVORK5CYII="),
    btl: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEhJREFUWIVj9OqM+s8wgIBpIC0fdcCoA0YdMOqAUQeMOmDUAQwMDAwsCqkCFBnwYPYHivQPeAiMOmDUAaMOGHXAqANGHTDqAAC2HgVuvol+fwAAAABJRU5ErkJggg=="),
    btr: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEZJREFUWIVj9OqM+s9AAVBIFaBEOwMTRbqpAEYdMOqAUQeMOmDUAaMOGHUAC6X1OaVgwENg1AGjDhh1wKgDRh0w6oBRBwAAEtMDmM0BoHIAAAAASUVORK5CYII="),
    l: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADpJREFUWIXtzkENACAMALGB3FnCHArIHICI8ez9L+nIkzca7VWdPWbr/hAAAAAAAAAAAAAAAAAAAMAD12YFbFSqT+cAAAAASUVORK5CYII="),
    ltb: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAElJREFUWIVjzHqX9Z+BAvBg9gdKtDMwUaSbCmDUAaMOGHXAqANGHTDqgFEHsFBqgEKqAEX6BzwERh0w6oBRB4w6YNQBow4YdQAAcscGA0I9FWUAAAAASUVORK5CYII="),
    ltt: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERJREFUWIXt1cEJACEQBEEVozWlS84IxAw0iBHuU/0fKPazdaxxStD8djIvLVo/CAAAAAAAAKCn/zzt9wsAAAAAAAAAXGJ8B9kIBCjCAAAAAElFTkSuQmCC"),
    m: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADNJREFUWIXtzkEBADAIxLBj8iZhjlA9ZPBJDTR1+/0sdjbnAAAAAAAAAAAAAAAAAAAASTIVZQJsW0v+EgAAAABJRU5ErkJggg=="),
    r: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADxJREFUWIXtzjERACAMALGCAiSgBwnsFYNqEFHG/P53aevsG4VmjsoevXR/CAAAAAAAAAAAAAAAAAAA4AFSMgMBU5I6OAAAAABJRU5ErkJggg=="),
    rtb: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERJREFUWIXt0LERwCAMA0CFY4CMkHkYgZ5hmJoMQeHm3Uv68zP2PCm8VjkOAAAAAAAAkCT9tuBb71W+/AMAAAAAAAAAP7C3AwOte8/aAAAAAElFTkSuQmCC"),
    rtt: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEhJREFUWIVjzHqX9Z9hAAHTQFo+6oBRB4w6YNQBow4YdcCoAxgYGBhYHsz+QJEBCqkCFOkf8BAYdcCoA0YdMOqAUQeMOmDUAQCNugYDMbeVHgAAAABJRU5ErkJggg=="),
    t: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAD1JREFUWIXt0EENACAQA8FCUIslzKGA4ABk3GdqYCdt88yXwvXKOAAAAAAAAECSjL1uKaD8AQAAAAAAAIAPAogFbje1fZ8AAAAASUVORK5CYII="),
    ttl: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEJJREFUWIXt0MENwCAMA0AXddqs1OWYAHUDGIJHPpe/7VOeWrXTeKNzHAAAAAAAACBJ3tuC+f1X+fYPAAAAAAAAABxnuQVufhEHigAAAABJRU5ErkJggg=="),
    ttr: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAElJREFUWIVj9OqM+s9AAVBIFaBEOwMTRbqpAEYdMOqAUQeMOmDUAaMOGHUAC6UGPJj9gSL9Ax4Cow4YdcCoA0YdMOqAUQeMOgAAQnkFbtw1YQsAAAAASUVORK5CYII="),
}

/**
 * random generator for a grid, uses 0 for empty, 1 for wall
 * @param {*} grid - the grid to populate
 * @param {*} wallPct - percentage of walls
 */
function gen(grid, wallPct) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = (Math.random() <= wallPct) ? 1 : 0;
            grid.set(v,i,j);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genOverlay(grid, overlay) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get(i,j);
            // only consider the walls
            if (!v) continue;
            // compute neighbors
            let p = {i:i, j:j};
            let neighbors = grid.right(p) + (grid.up(p) << 1) + (grid.left(p) << 2) + (grid.down(p)<<3);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            //console.log("i: " + i + " j: " + j + " n: " + neighbors);
            switch (neighbors) {
                case 0: // none
                    tl = "ttl";
                    tr = "rtt";
                    bl = "ltb";
                    br = "btr";
                    break;
                case 1: // right
                    tl = "ttl";
                    tr = "t";
                    bl = "ltb";
                    br = "b";
                    break;
                case 2: // top
                    tl = "l";
                    tr = "r";
                    bl = "ltb";
                    br = "btr";
                    break;
                case 3: // top|right
                    tl = "l";
                    tr = (grid.ur(p)) ? "m" : "ttr";
                    bl = "ltb";
                    br = "b";
                    break;
                case 4: // left
                    tl = "t";
                    tr = "rtt";
                    bl = "b";
                    br = "btr";
                    break;
                case 5: // left|right
                    tl = "t";
                    tr = "t";
                    bl = "b";
                    br = "b";
                    break;
                case 6: // top|left
                    tl = (grid.ul(p)) ? "m" : "ltt";
                    tr = "r";
                    bl = "b";
                    br = "btr";
                    break;
                case 7: // top|left|right
                    tl = (grid.ul(p)) ? "m" : "ltt";
                    tr = (grid.ur(p)) ? "m" : "ttr"
                    bl = "b";
                    br = "b";
                    break;
                case 8: // down
                    tl = "ttl";
                    tr = "rtt";
                    bl = "l";
                    br = "r";
                    break;
                case 9: // down|right
                    tl = "ttl";
                    tr = "t";
                    bl = "l";
                    br = (grid.dr(p)) ? "m" : "rtb";
                    break;
                case 10: // top|down
                    tl = "l";
                    tr = "r";
                    bl = "l";
                    br = "r";
                    break;
                case 11: // top|down|right
                    tl = "l";
                    tr = (grid.ur(p)) ? "m" : "ttr"
                    bl = "l";
                    br = (grid.dr(p)) ? "m" : "rtb"
                    break;
                case 12: // down|left
                    tl = "t";
                    tr = "rtt";
                    bl = (grid.dl(p)) ? "m" : "btl"
                    br = "r";
                    break;
                case 13: // down|left|right
                    tl = "t";
                    tr = "t";
                    bl = (grid.dl(p)) ? "m" : "btl"
                    br = (grid.dr(p)) ? "m" : "rtb"
                    break;
                case 14: // top|down|left
                    tl = (grid.ul(p)) ? "m" : "ltt";
                    tr = "r";
                    bl = (grid.dl(p)) ? "m" : "btl"
                    br = "r";
                    break;
                case 15: // top|down|left|right
                    tl = (grid.ul(p)) ? "m" : "ltt";
                    tr = (grid.ur(p)) ? "m" : "ttr"
                    bl = (grid.dl(p)) ? "m" : "btl"
                    br = (grid.dr(p)) ? "m" : "rtb"
                    break;
            }
            // add to overlay grid
            if (tl) overlay.set(tl, i*2, j*2);
            if (tr) overlay.set(tr, i*2+1, j*2);
            if (bl) overlay.set(bl, i*2, j*2+1);
            if (br) overlay.set(br, i*2+1, j*2+1);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genPerspectiveOverlay(grid, overlay) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get(i,j);
            // compute neighbors
            let p = {i:i, j:j};
            let neighbors = grid.right(p) + (grid.up(p) << 1) + (grid.left(p) << 2) + (grid.down(p)<<3);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            //console.log("i: " + i + " j: " + j + " n: " + neighbors);
            switch (neighbors) {
                case 0: // none
                    if (v) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 1: // right
                    if (v) { // wall
                        tl = "ltbs";
                        tr = "ltbi";
                        bl = "ltb";
                        br = (grid.dr(p)) ? "btls": "ltbe";
                    }
                    break;
                case 2: // top
                    if (v) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 3: // top|right
                    if (v) { // wall
                        tl = "ltbs";
                        tr = "ltbi";
                        bl = "ltb";
                        br = (grid.dr(p)) ? "btls": "ltbe";
                    } else { // empty
                        tr = (grid.ur(p)) ? "obtl" : "";
                    }
                    break;
                case 4: // left
                    if (v) { // wall
                        tl = "btri";
                        tr = "btre";
                        bl = "btrs";
                        bl = (grid.dl(p)) ? "rtbe": "btrs";
                        br = "btr";
                    }
                    break;
                case 5: // left|right
                    if (v) { // wall
                        tl = "bi";
                        tr = "bi";
                        bl = (grid.dl(p)) ? "rtbe": "btrs";
                        br = (grid.dr(p)) ? "btls": "ltbe";
                    }
                    break;
                case 6: // top|left
                    if (v) { // wall
                        tl = "btri";
                        tr = "btre";
                        bl = (grid.dl(p)) ? "rtbe": "btrs";
                        br = "btr";
                    } else { // empty
                        tl = (grid.ul(p)) ? "ortb" : "";
                    }
                    break;
                case 7: // top|left|right
                    if (v) { // wall
                        tl = "bi";
                        tr = "bi";
                        bl = "b";
                        br = (grid.dr(p)) ? "btls": "ltbe";
                    } else { // empty
                        tl = (grid.ul(p)) ? "ortb" : "";
                        tr = (grid.ur(p)) ? "obtl" : "";
                    }
                    break;
                case 8: // down
                    if (v) { // wall
                        tl = "ttl";
                        tr = "rtt";
                        bl = (grid.dl(p)) ? "ltts" : "ttle";
                        br = (grid.dr(p)) ? "ttre": "rtts";
                    } else { // empty
                        bl = (grid.dl(p)) ? "ot" : "ottl";
                        br = (grid.dr(p)) ? "ot" : "ortt";
                    }
                    break;
                case 9: // down|right
                    if (v) { // wall
                        tl = "ttl";
                        tr = (grid.dr(p)) ? "ttls" : "rtbi";
                        bl = (grid.dl(p)) ? "ltts" : "ttle";
                        br = (grid.dr(p)) ? "m" : "rtb";
                    } else { // empty
                        tr = (grid.dr(p)) ? "oltt" : "";
                        bl = (grid.dl(p)) ? "ot" : "ottl";
                        br = (grid.dr(p)) ? "oltte" : "ortt";
                    }
                    break;
                case 10: // top|down
                    if (v) { // wall
                        tl = "l";
                        tr = "r";
                        bl = (grid.dl(p)) ? "ltts": "l";
                        br = (grid.dr(p)) ? "ttre": "r";
                    } else {
                        bl = (grid.dl(p)) ? "ot" : "ottl";
                        br = (grid.dr(p)) ? "ot" : "ortt";
                    }
                    break;
                case 11: // top|down|right
                    if (v) { // wall
                        tl = "l";
                        tr = (grid.dr(p)) ? (grid.ur(p)) ? "m" : "ttr" : "rtbi";
                        bl = (grid.dl(p)) ? "ltts": "l";
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between oltt and obtl
                        tr = (grid.ur(p)) ? "obtl" : "";
                        br = (grid.dr(p)) ? "oltte" : "ortt";
                        bl = (grid.dl(p)) ? "ot" : "ottl";
                    }
                    break;
                case 12: // down|left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtte" : "btli";
                        tr = "rtt";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "ttre": "rtts";
                    } else { // empty
                        tl = (grid.dl(p)) ? "ottr" : "";
                        bl = (grid.dl(p)) ? "ottrs" : "ottl";
                        br = (grid.dr(p)) ? "ot" : "ortt";
                    }
                    break;
                case 13: // down|left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "t" : "btli";
                        tr = (grid.dr(p)) ? "t" : "rtbi";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        tl = (grid.dl(p)) ? "ottr" : "";
                        tr = (grid.dr(p)) ? "oltt" : "";
                        bl = (grid.dl(p)) ? "ottrs" : "ottl";
                        br = (grid.dr(p)) ? "oltte" : "ortt";
                    }
                    break;
                case 14: // top|down|left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? (grid.ul(p)) ? "m" : "ltt" : "btli";
                        tr = "r";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "ttre": "r";
                    } else { // empty
                        // FIXME: conflict between oltt and obtl
                        tl = (grid.ul(p)) ? "ortb" : "";
                        bl = (grid.dl(p)) ? "ottrs" : "ottl";
                        br = (grid.dr(p)) ? "ot" : "ortt";
                    }
                    break;
                case 15: // top|down|left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? (grid.ul(p)) ? "m" : "ltt" : "btli";
                        tr = (grid.dr(p)) ? (grid.ur(p)) ? "m" : "ttr" : "rtbi";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between ottr and ortb
                        // FIXME: conflict between oltt and obtl
                        tl = (grid.dl(p)) ? "ottr" : (grid.ul(p)) ? "ortb" : "";
                        tr = (grid.dr(p)) ? "oltt" : (grid.ur(p)) ? "obtl" : "";
                        bl = (grid.dl(p)) ? "ottrs" : "ottl";
                        br = (grid.dr(p)) ? "oltte" : "ortt";
                    }
                    break;
            }
            // add to overlay grid
            if (tl) overlay.set(tl, i*2, j*2);
            if (tr) overlay.set(tr, i*2+1, j*2);
            if (bl) overlay.set(bl, i*2, j*2+1);
            if (br) overlay.set(br, i*2+1, j*2+1);
        }
    }
}

/**
 * a grid of data
 */
class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Array(width*height);
    }

    idx(p, j) {
        if (typeof p === 'number') {
            return (p) % this.width + this.width*j;
        }
        return (p.i) % this.width + this.width*p.j;
    }

    set(v, p, j) {
        let idx = this.idx(p, j);
        this.data[idx] = v;
    }

    get(p,j) {
        let idx = this.idx(p, j);
        return this.data[idx];
    }

    /**
     *  get node left of given point
     */ 
    left(p, dflt=0) {
        if (p.i>0) {
            let idx = this.idx(p.i-1, p.j);
            return this.data[idx];
        }
        return dflt;
    }

    right(p, dflt=0) {
        if (p.i<this.width-1) {
            let idx = this.idx(p.i+1, p.j);
            return this.data[idx];
        }
        return dflt;
    }

    up(p, dflt=0) {
        if (p.j>0) {
            let idx = this.idx(p.i, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    down(p, dflt=0) {
        if (p.j<this.height-1) {
            let idx = this.idx(p.i, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }

    ul(p, dflt=0) {
        if (p.i>0 && p.j>0) {
            let idx = this.idx(p.i-1, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    ur(p, dflt=0) {
        if (p.i<this.width-1 && p.j>0) {
            let idx = this.idx(p.i+1, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    dl(p, dflt=0) {
        if (p.i>0 && p.j<this.height-1) {
            let idx = this.idx(p.i-1, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }

    dr(p, dflt=0) {
        if (p.i<this.width-1 && p.j<this.height-1) {
            let idx = this.idx(p.i+1, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }
}


/**
 * the test game/environment
 */
class Game {
    constructor() {
        this.objs = [];
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
    }


    play() {
        let tsize = 32;
        let width = 16;
        let height = 12;
        // generate the test grid and level data
        let grid = new Grid(width, height);
        gen(grid, .35);

        // generate the bg overlay based on level data
        let bgoverlay = new Grid(width*2, height*2);
        genOverlay(grid, bgoverlay);

        // generate the perspective overlay based on level data
        let poverlay = new Grid(width*2, height*2);
        genPerspectiveOverlay(grid, poverlay);

        // draw grid
        for (let j=0; j<height; j++) {
            for (let i=0; i<width; i++) {
                let v = grid.get(i,j);
                let img = (v) ? fgtw : fgte;
                this.ctx.drawImage(img, tsize*i*2, tsize*j*2, 64, 64);
            }
        }

        // draw background overlay
        for (let j=0; j<bgoverlay.height; j++) {
            for (let i=0; i<bgoverlay.width; i++) {
                let v = bgoverlay.get(i,j);
                if (!v) continue;
                //console.log("i: " + i + " j: " + j + " v: " + v);
                let img = tiles[v];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }

        // draw perspective overlay
        for (let j=0; j<poverlay.height; j++) {
            for (let i=0; i<poverlay.width; i++) {
                let v = poverlay.get(i,j);
                if (!v) continue;
                //console.log("i: " + i + " j: " + j + " v: " + v);
                let img = newtiles[v];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }
    }
}

window.onload = function() {
    // create game
    let game = new Game();
    // play
    game.play();
}